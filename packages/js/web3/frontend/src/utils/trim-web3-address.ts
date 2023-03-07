export function trimWeb3Address(address: string, maxLength = 12) {
    if (maxLength >= address.length)
        return address;
    return `${address.slice(0, maxLength - 4 - 3)}...${address.slice(-4)}`;
}
