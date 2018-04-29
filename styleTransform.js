
module.exports = function(css)
{
    // Insert the extension ID into CSS
    return css.replace(/__MSG_@@extension_id__/g, chrome.runtime.id);
}
