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
    address[] public users;

    HDMAccountManager accountManager;

    struct DataRequest {
        address requestee;
        uint256 data;
    }

    struct DataPermissions {
        uint256 hash;
        address owner;
        address user;
        bool isRevoked;
    }

    event DataRequested (
        address indexed requester,
        address indexed requestee,
        uint256 indexed requestIndex
    );

    event DataPermissionsGranted (
        address indexed user,
        address indexed owner,
        uint256 indexed requestIndex,
        uint256 dataHash
    );

    event DataPermissionsRevoked (
        address indexed user,
        address indexed owner,
        uint256 indexed dataHash
    );

    modifier checkIfSenderIsBanned() {
        accountManager.checkAccountBanned(msg.sender);
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function _registerUser(address _user)
        private {
        if (requests[_user].length == 0) {
            users.push(_user);
        }
    }

    function requestPermissions(
        address _requestee,
        uint256 _data
    ) public checkIfSenderIsBanned {
        require(
            _requestee != msg.sender, 
            "HDMAccessControl: user cannot request data from themselves."
        );

        _registerUser(msg.sender);

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

    function grantPermissionsFromRequest(
        address _requester,
        uint256 _requestIndex,
        uint256 _dataHash
    ) public checkIfSenderIsBanned {
        _registerUser(msg.sender);

        DataRequest storage requestRef = requests[_requester][_requestIndex];

        require(
            requestRef.requestee == msg.sender, 
            "HDMAccessControl: user has no rights to accept this data request."
        );

        permissions[_dataHash] = DataPermissions(
            _dataHash,
            msg.sender,
            _requester,
            false
        );

        permissionsByOwners[msg.sender].push(_dataHash);
        permissionsByUsers[_requester].push(_dataHash);

        emit DataPermissionsGranted(
            _requester,
            msg.sender,
            _requestIndex,
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
}
 
