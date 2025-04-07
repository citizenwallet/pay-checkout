export const getTerminalIdFromOrderCode = async (orderCode: number) => {
  const strOrderCode = orderCode.toString();
  const terminalId = strOrderCode.slice(-6);
  return terminalId;
};
