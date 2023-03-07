// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract HDMHandshake {
    event Message (
        address indexed sender,
        address indexed receiver,
        bytes indexed data
    );

    function send(address _receiver, bytes calldata _data) public {
        require(
            msg.sender != _receiver,
            "HDMHandshake: cannot post a message for yourself."
        );

        emit Message(
            msg.sender,
            _receiver,
            _data
        );
    }
}
 
