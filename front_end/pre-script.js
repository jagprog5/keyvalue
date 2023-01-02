// script loaded before the style is set
// needed to prevent FOIT (flash of incorrect theme)

const THEME = "theme";
const DEFAULT = "default"; // use system default, whatever is specified by the user agent or OS
const TOGGLED = "toggled"; // opposite of default (light/dark)
var theme = localStorage.getItem(THEME) || DEFAULT;
// "theme" attribute is then accessed in style.css for the initial style:
document.documentElement.setAttribute(THEME, theme);
