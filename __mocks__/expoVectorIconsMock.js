// Lightweight mock: render icon families as a Text node so jest doesn't load fonts.
const React = require('react');
const { Text } = require('react-native');
const makeIcon = (family) => {
  const Icon = ({ name, testID }) =>
    React.createElement(Text, { testID: testID ?? `icon-${family}-${name}` }, name ?? '');
  Icon.displayName = family;
  return Icon;
};
module.exports = new Proxy(
  {},
  { get: (_t, key) => (key === '__esModule' ? true : makeIcon(String(key))) }
);
