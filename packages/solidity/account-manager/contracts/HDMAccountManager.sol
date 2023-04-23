// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract HDMAccountManager is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct AccountInfo {
        bool isProfilePublic;
        bool isDoctor;
        bool isBanned;
    }

    mapping(address => AccountInfo) accounts;
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    function promoteToDoctor(address _account) public onlyRole(MANAGER_ROLE) {
        require(
            accounts[_account].isDoctor == false,
            "HDMAccountManager: account is a doctor already."
        );

        accounts[_account].isDoctor = true;
    }

    function makeCurrentAccountPublic() public {
        require(
            accounts[msg.sender].isProfilePublic == false,
            "HDMAccountManager: account has a public profile already."
        );

        accounts[msg.sender].isProfilePublic = true;
    }

    function makeCurrentAccountPrivate() public {
        require(
            accounts[msg.sender].isProfilePublic == true,
            "HDMAccountManager: account has no public profile already."
        );

        accounts[msg.sender].isProfilePublic = false;
    }

    function ban(address _account) public onlyRole(MANAGER_ROLE) {
        require(
            accounts[_account].isBanned == false,
            "HDMAccountManager: account is banned already."
        );

        accounts[_account].isBanned = true;
    }

    function unban(address _account) public onlyRole(MANAGER_ROLE) {
        require(
            accounts[_account].isBanned == true,
            "HDMAccountManager: account was not banned already."
        );

        accounts[_account].isBanned = false;
    }

    function getAccountInfo(address _account) public view returns(AccountInfo memory) {
        return accounts[_account];
    }

    function checkAccountBanned(address _account) public view {
        require(
            accounts[_account].isBanned == false,
            "HDMAccountManager: account is banned."
        );
    }
}
 
