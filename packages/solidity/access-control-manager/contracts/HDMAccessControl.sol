// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface HDMAccountManager {
    struct AccountInfo {
        bool isDoctor;
        bool isBanned;
    }

    function checkAccountBanned(address _account) external view;
}

contract HDMAccessControl is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    DataPermissions[] public permissions;
    mapping(address => uint256[]) public permissionsByOwners;
    mapping(address => uint256[]) public permissionsByUsers;
    mapping(uint256 => uint256[]) public permissionsByHashes;
    mapping(uint256 => address) public hashOwners;
    mapping(address => DataRequest[]) public requests;
    
    mapping(bytes32 => bool) public userConnectionRequests;
    mapping(address => address[]) public userConnections;
    mapping(address => address[]) public userBlocks;

    HDMAccountManager accountManager;

    struct DataRequest {
        address requestee;
        uint256 data;
    }

    // 4 slots
    struct DataPermissions {
        uint256 hash;       // 32 bytes
        uint256 parentHash; // 32 bytes
        address owner;      // 20 bytes
        address user;       // 20 bytes
        bool isRevoked;     // 1 byte
        uint48 expiresAt;   // 6 bytes
    }

    // 5 slots
    struct DataPermissionsWithIndex {
        uint256 index;
        uint256 hash;       // 32 bytes
        uint256 parentHash; // 32 bytes
        address owner;      // 20 bytes
        address user;       // 20 bytes
        bool isRevoked;     // 1 byte
        uint48 expiresAt;   // 6 bytes
    }

    event DataRequested (
        address indexed requester,
        address indexed requestee,
        uint256 indexed requestIndex
    );

    event DataPermissionsGranted (
        address indexed user,
        address indexed owner,
        uint256 indexed permsIndex
    );

    event DataPermissionsRevoked (
        address indexed user,
        address indexed owner,
        uint256 indexed permsIndex
    );

    event UserConnectionCreated (
        address indexed user1,
        address indexed user2
    );

    event UserConnectionRequested (
        address indexed requester,
        address indexed requestee,
        uint256 indexed hash
    );

    event UserBlocked (
        address indexed sender,
        address indexed user
    );

    modifier checkIfSenderIsBanned() {
        accountManager.checkAccountBanned(msg.sender);
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function requestPermissions(
        address _requestee,
        uint256 _data
    ) public checkIfSenderIsBanned {
        require(
            _requestee != msg.sender, 
            "HDMAccessControl: user cannot request data from themselves."
        );

        requests[msg.sender].push(
            DataRequest(
                _requestee,
                _data
            )
        );

        uint256 requestIndex = requests[msg.sender].length - 1;

        emit DataRequested(
            msg.sender,
            _requestee,
            requestIndex
        );
    }

    function getDataRequestInfo(address _requester, uint256 _requestIndex)
        external
        view
        returns (DataRequest memory)
    {
        return requests[_requester][_requestIndex];
    }

    function grantPermissions(
        address _user,
        uint256 _hash,
        uint48 _expiresIn
    ) public checkIfSenderIsBanned {
        require(
            _hash != 0x0,
            "HDMAccessControl: null data hashes are not allowed."
        );

        require(
            _user != msg.sender,
            "HDMAccessControl: user cannot grant permissions for data of their own."
        );

        uint256 index = permissions.length;

        DataPermissions storage perms = permissions.push();
        perms.hash = _hash;
        perms.owner = msg.sender;
        perms.user = _user;
        perms.isRevoked = false;
        perms.expiresAt = _expiresIn == 0 ? 0 : uint48(block.timestamp) + _expiresIn;

        permissionsByOwners[msg.sender].push(index);
        permissionsByUsers[_user].push(index);
        permissionsByHashes[_hash].push(index);
        hashOwners[_hash] = msg.sender;

        emit DataPermissionsGranted(
            _user,
            msg.sender,
            index
        );
    }

    function grantPermissionsFor(
        uint256 _hash,
        uint256 _parentHash,
        uint48 _expiresIn
    ) public checkIfSenderIsBanned {
        require(
            _hash != 0x0,
            "HDMAccessControl: null data hashes are not allowed."
        );

        require(
            checkPermissions(_parentHash, msg.sender),
            "HDMAccessControl: you are not allow to claim permissions based on this parent hash."
        );

        address parentHashOwner = hashOwners[_parentHash];
        uint256 index = permissions.length;

        DataPermissions storage perms = permissions.push();
        perms.hash = _hash;
        perms.owner = parentHashOwner;
        perms.parentHash = _parentHash;
        perms.user = msg.sender;
        perms.isRevoked = false;
        perms.expiresAt = _expiresIn == 0 ? 0 : uint48(block.timestamp) + _expiresIn;

        permissionsByOwners[parentHashOwner].push(index);
        permissionsByUsers[msg.sender].push(index);
        permissionsByHashes[_hash].push(index);
        hashOwners[_hash] = parentHashOwner;

        emit DataPermissionsGranted(
            msg.sender,
            parentHashOwner,
            index
        );
    }

    function revokePermissions(uint256 _index)
        public
        checkIfSenderIsBanned
    {
        DataPermissions storage perms = permissions[_index];

        require(
            perms.owner == msg.sender, 
            "HDMAccessControl: user has no rights to manage this data object."
        );

        require(
            !perms.isRevoked, 
            "HDMAccessControl: data had been revoked already."
        );

        permissions[_index].isRevoked = true;

        emit DataPermissionsRevoked(
            perms.user,
            msg.sender,
            _index
        );
    }

    function getDataPermissionsIndicesByOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        return permissionsByOwners[_owner];
    }

    function getDataPermissionsIndicesByUser(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return permissionsByUsers[_user];
    }

    function checkPermissions(uint256 _hash, address _user)
        internal
        view
        returns (bool)
    {
        uint256[] memory indices = permissionsByHashes[_hash];
        for (uint256 i = 0; i < indices.length; i++) {
            uint256 index = indices[i];
            DataPermissions storage perms = permissions[index];
            if (perms.isRevoked)
                continue;
            if (perms.user != address(0) && perms.user != _user)
                continue;
            if (perms.expiresAt != 0x0 && perms.expiresAt < uint48(block.timestamp))
                continue;
            
            if (perms.parentHash != 0x0) {
                return checkPermissions(perms.parentHash, _user);
            } else {
                return true;
            }
        }

        return false;
    }

    function getDataPermissionsByUser(address _user)
        external
        view
        returns (DataPermissionsWithIndex[] memory)
    {
        uint256[] memory indices = permissionsByUsers[_user];
        DataPermissionsWithIndex[] memory filtered = new DataPermissionsWithIndex[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            uint256 index = indices[i];
            DataPermissions storage perms = permissions[index];
            if (!checkPermissions(perms.hash, _user))
                continue;

            filtered[i] = DataPermissionsWithIndex(
                index,
                perms.hash,
                perms.parentHash,
                perms.owner,
                perms.user,
                perms.isRevoked,
                perms.expiresAt
            );
        }

        return filtered;
    }

    function getDataPermissionsByOwner(address _owner)
        external
        view
        returns (DataPermissionsWithIndex[] memory)
    {
        uint256[] memory indices = permissionsByOwners[_owner];
        DataPermissionsWithIndex[] memory filtered = new DataPermissionsWithIndex[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            uint256 index = indices[i];
            DataPermissions storage perms = permissions[index];
            if (!checkPermissions(perms.hash, address(0)))
                continue;

            filtered[i] = DataPermissionsWithIndex(
                index,
                perms.hash,
                perms.parentHash,
                perms.owner,
                perms.user,
                perms.isRevoked,
                perms.expiresAt
            );
        }

        return filtered;
    }

    function getDataPermissionsInfo(uint256 _index)
        external
        view
        returns (DataPermissions memory)
    {
        return permissions[_index];
    }

    function setAccountManagerContractAddress(address _accountManagerAddress) 
        public
        onlyRole(MANAGER_ROLE)
    {
        accountManager = HDMAccountManager(_accountManagerAddress);
    }

    function getUserConnections(address _user)
        external
        view
        returns (address[] memory)
    {
        return userConnections[_user];
    }

    function requestUserConnection(address _targetUser, uint256 _hash)
        public
        checkIfSenderIsBanned
    {
        require(
            _targetUser != msg.sender, 
            "HDMAccessControl: user cannot request a connection with themselves."
        );

        userConnectionRequests[keccak256(abi.encodePacked(_targetUser, msg.sender))] = true;

        emit UserConnectionRequested(
            msg.sender,
            _targetUser,
            _hash
        );
    }

    function addUserConnection(address _targetUser)
        public
        checkIfSenderIsBanned
    {
        require(
            _targetUser != msg.sender,
            "HDMAccessControl: user cannot add a connection with themselves."
        );

        require(
            userConnectionRequests[keccak256(abi.encodePacked(msg.sender, _targetUser))] || userConnectionRequests[keccak256(abi.encodePacked(_targetUser, msg.sender))],
            "HDMAccessControl: user cannot add a connection without an existing connection request."
        );

        userConnections[_targetUser].push(msg.sender);
        userConnections[msg.sender].push(_targetUser);

        emit UserConnectionCreated(
            msg.sender,
            _targetUser
        );
    }

    function blockUser(address _targetUser)
        public
        checkIfSenderIsBanned
    {
        require(
            _targetUser != msg.sender, 
            "HDMAccessControl: user cannot block themselves."
        );

        userBlocks[msg.sender].push(_targetUser);

        emit UserBlocked(
            msg.sender,
            _targetUser
        );
    }

    function getUserBlocks(address _user)
        external
        view
        returns (address[] memory)
    {
        return userBlocks[_user];
    }
}
 
