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

    mapping(uint256 => DataPermissions) public permissions;
    mapping(address => uint256[]) public permissionsByOwners;
    mapping(address => uint256[]) public permissionsByUsers;
    mapping(address => DataRequest[]) public requests;
    
    mapping(bytes32 => bool) public userConnectionRequests;
    mapping(address => address[]) public userConnections;
    mapping(address => address[]) public userBlocks;

    HDMAccountManager accountManager;

    struct DataRequest {
        address requestee;
        uint256 data;
    }

    // 3 slots
    struct DataPermissions {
        uint256 hash;       // 32 bytes
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
        uint256 indexed dataHash
    );

    event DataPermissionsRevoked (
        address indexed user,
        address indexed owner,
        uint256 indexed dataHash
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
        uint256 _dataHash,
        uint48 _expiresIn
    ) public checkIfSenderIsBanned {
        permissions[_dataHash] = DataPermissions(
            _dataHash,
            msg.sender,
            _user,
            false,
            _expiresIn == 0 ? 0 : uint48(block.timestamp) + _expiresIn
        );

        permissionsByOwners[msg.sender].push(_dataHash);
        permissionsByUsers[_user].push(_dataHash);

        emit DataPermissionsGranted(
            _user,
            msg.sender,
            _dataHash
        );
    }

    function revokePermissions(uint256 _dataHash)
        public
        checkIfSenderIsBanned
    {
        DataPermissions storage permsRef = permissions[_dataHash];

        require(
            permsRef.owner == msg.sender, 
            "HDMAccessControl: user has no rights to manage this data object."
        );

        require(
            !permsRef.isRevoked, 
            "HDMAccessControl: data had been revoked already."
        );

        permissions[_dataHash].isRevoked = true;

        emit DataPermissionsRevoked(
            permsRef.user,
            msg.sender,
            _dataHash
        );
    }

    function getDataPermissionsByOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        return permissionsByOwners[_owner];
    }

    function getDataPermissionsByUser(address _user)
        external
        view
        returns (uint256[] memory)
    {
        return permissionsByUsers[_user];
    }

    function getDataPermissionsInfo(uint256 _dataHash)
        external
        view
        returns (DataPermissions memory)
    {
        return permissions[_dataHash];
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
 
