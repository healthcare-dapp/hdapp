// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract HDMHandshake {
    event Message (
        address indexed sender,
        uint256 indexed deviceHash
    );

    function send(uint256 _deviceHash, bytes calldata) public {
        emit Message(
            msg.sender,
            _deviceHash
        );
    }

    /* function multiSend(uint256[] calldata _deviceHashes, bytes[] calldata) public {
        for (uint256 i = 0; i < _deviceHashes.length; i++) {
            emit Message(
                msg.sender,
                _deviceHashes[i]
            );
        }
    } */
}
 
