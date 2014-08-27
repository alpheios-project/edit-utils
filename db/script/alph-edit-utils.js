/**
 * @fileoverview alph-edit-utils - editor utility functions
 *  
 * Copyright 2009-2010 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @class Alpheios editor utility functions
 */
var AlphEdit = {

//****************************************************************************
// functions to manipulate multi-valued class attribute
//****************************************************************************

/**
 * Get class attribute values
 * @param {Element} a_elt element to use
 * @returns array of class values (empty if none exist)
 * @type Array
 */
getClass : function(a_elt)
{
    var attr = a_elt.getAttributeNS(null, "class");
    return (attr ? attr.split(' ') : Array());
},

/**
 * Add value to class attribute
 * @param {Element} a_elt element to use
 * @param {String} a_class value to add
 */
addClass : function(a_elt, a_class)
{
    var classVals = this.getClass(a_elt);
    for (i in classVals)
    {
        // if class already there, nothing to do
        if (classVals[i] == a_class)
            return;
    }
    classVals.push(a_class);
    a_elt.setAttributeNS(null, "class", classVals.join(' '));
},

/**
 * Remove value from class attribute
 * @param {Element} a_elt element to use
 * @param {String} a_class value to remove
 */
removeClass : function(a_elt, a_class)
{
    // if no value specified, remove whole value
    if (!a_class)
    {
        a_elt.removeAttributeNS(null, "class");
        return;
    }

    var classVals = this.getClass(a_elt);
    for (i in classVals)
    {
        // if class there, remove it
        if (classVals[i] == a_class)
        {
            classVals.splice(i, 1);
            a_elt.setAttributeNS(null, "class", classVals.join(' '));
            return;
        }
    }
    // if not found, nothing to do
},

/**
 * Toggle value in class attribute
 * Remove value if present, add value if not present
 * @param {Element} a_elt element to use
 * @param {String} a_class value to change
 */
toggleClass : function(a_elt, a_class)
{
    // if value is present remove it
    if ($(a_elt).hasClass(a_class))
      removeClass(a_elt, a_class);
    // if not present, add it
    else
      addClass(a_elt, a_class);
},

//****************************************************************************
// history/state
//****************************************************************************

// data for history
d_history : Array(),                        // array of actions
d_historyCursor : 0,                        // position in history
d_saveCursor : 0,                           // position of last save

/**
 * Clear history
 */
clearHistory : function()
{
    this.d_history = [];
    this.d_historyCursor = 0;
    this.d_saveCursor = 0;
},

/**
 * Clear notifications
 */
clearNotifications : function()
{
    $("#alpheios-put-notice").empty();
},


/**
 * Add event to history
 * @param {Array} a_hEvent event
 * @param {function} a_updateCallback update callback function
 */
pushHistory : function(a_hEvent, a_updateCallback)
{
    // remove any lingering save message
    AlphEdit.clearNotifications();
    
    // destroy any redo history and adjust save points and buttons
    if (this.d_historyCursor < this.d_history.length)
    {
        this.d_history.splice(this.d_historyCursor);
        $("#redo-button", document).attr("disabled", "disabled");

        // if we just destroyed save point in history
        if (this.d_saveCursor > this.d_historyCursor)
        {
          // remember that no point in history corresponds to last save
          this.d_saveCursor = -1;
          $("#save-button", document).removeAttr("disabled");
        }
    }

    // save event plus alignment state
    this.d_history.push(a_hEvent);
    this.d_historyCursor++;

    // adjust buttons
    $("#undo-button", document).removeAttr("disabled");
    if (this.d_saveCursor == this.d_historyCursor)
      $("#save-button", document).attr("disabled", "disabled");
    else
      $("#save-button", document).removeAttr("disabled");

    // update state
    if (a_updateCallback)
        a_updateCallback(a_hEvent, 1);
},

/**
 * Return event from undo history
 * @param {function} a_updateCallback update callback function
 * @returns event from history
 * @type Array
 */
popHistory : function(a_updateCallback)
{
    // fail if no history exists
    if (this.d_historyCursor == 0)
        return null;

    // get event and disable undo button if it's last one
    var event = this.d_history[--this.d_historyCursor];
    if (this.d_historyCursor == 0)
        $("#undo-button", document).attr("disabled", "disabled");

    // adjust buttons
    document.getElementById("redo-button").removeAttribute("disabled");
    if (this.d_saveCursor == this.d_historyCursor)
        $("#save-button", document).attr("disabled", "disabled");
    else
        $("#save-button", document).removeAttr("disabled");

    // update state
    if (a_updateCallback)
        a_updateCallback(event, -1);

    return event;
},

/**
 * Return event from redo history
 * @param {function} a_updateCallback update callback function
 * @returns event from history
 * @type Array
 */
repushHistory : function(a_updateCallback)
{
    // fail if nothing to redo exists
    if (this.d_historyCursor == this.d_history.length)
        return null;

    // get event and disable redo button if it's last one
    var event = this.d_history[this.d_historyCursor++];
    if (this.d_historyCursor == this.d_history.length)
        $("#redo-button", document).attr("disabled", "disabled");

    // adjust buttons
    $("#undo-button", document).removeAttr("disabled");
    if (this.d_saveCursor == this.d_historyCursor)
      $("#save-button", document).attr("disabled", "disabled");
    else
      $("#save-button", document).removeAttr("disabled");

    // update state
    if (a_updateCallback)
        a_updateCallback(event, 1);

    return event;
},

/**
 * Note that results have been saved
 */
saved : function()
{
    this.d_saveCursor = this.d_historyCursor;
    $("#save-button", document).attr("disabled", "disabled");
},

/**
 * Note that results need to be saved
 */
unsaved : function()
{
    this.d_saveCursor = -1;
    $("#save-button", document).removeAttr("disabled");
},

/**
 * Show formatted history in separate window
 * @param {function} a_formatCallback function to format single event
 */
showHistory : function(a_formatCallback)
{
    var history = window.open("",
                              "editor_history",
                              "dependent=yes," +
                              "location=no," +
                              "toolbar=no," +
                              "menubar=no," +
                              "directories=no," +
                              "status=no," +
                              "resizable=yes," +
                              "scrollbars=yes," +
                              "height=480," +
                              "width=640",
                              false).document;
    $("head title", history).text("Alpheios Edit History");
    $("body", history).append(
            "<table class='edit-history'>" +
              "<thead>" +
                "<tr>" +
                  "<td/>" +
                  "<td/>" +
                  "<td>Event</td>" +
                "</tr>" +
              "</thead>" +
              "<tbody/>" +
            "</table>");
    var i;
    for (i = 0; i < this.d_history.length; ++i)
    {
        $("table tbody", history).append(
            "<tr style='border-collapse:collapse'>" +
              "<td>" +
                ((i == this.d_historyCursor) ? "current &#x21B1;" : "") +
              "</td>" +
              "<td>" +
                (i + 1) +
              "</td>" +
              "<td style='border:1px solid; border-collapse:collapse'>" +
                a_formatCallback(this.d_history[i]) +
              "</td>" +
              "<td>" +
                ((i == this.d_saveCursor) ? "&#x21B0; saved" : "") +
              "</td>" +
            "</tr>");
    }
    if ((this.d_historyCursor >= i) || (this.d_saveCursor >= i))
    {
        $("table tbody", history).append(
            "<tr>" +
              "<td>" +
                ((i == this.d_historyCursor) ? "current &#x21B1;" : "") +
              "</td>" +
              "<td/>" +
              "<td/>" +
              "<td>" +
                ((i == this.d_saveCursor) ? "&#x21B0; saved" : "") +
              "</td>" +
            "</tr>");
    }
},

//****************************************************************************
// save
//****************************************************************************

/**
 * Check whether unsaved changes exist
 * @returns true if in-memory state does not match saved state
 * @type Boolean
 */
unsavedChanges: function()
{
    return (this.d_saveCursor != this.d_historyCursor);
},

/**
 * Get contents of sentence from database
 * @param {String} a_url URL to get sentence from
 * @param {Object} a_params array of parameters
 * @returns sentence
 * @type {Document}
 */
getContents: function(a_url, a_params)
{
    // get treebank sentence
    var req = new XMLHttpRequest();
    var builtUrl = a_url.replace('DOC_REPLACE',a_params['doc']);
    builtUrl = builtUrl.replace('S_REPLACE',(a_params['id'] ? a_params['id'] : a_params['s']));
    builtUrl = builtUrl.replace('APP_REPLACE',a_params['app']);
    req.open("GET", builtUrl, false);
    
    req.send(null);
    var root = null;
    if (req.status == 200) {
        root = $(req.responseXML.documentElement);
    }
    if ((req.status != 200) || root == null || root.is("error"))
    {
        var msg = root.is("error") ? root.text() :
                                     "Error getting sentence (" +
                                       urlParams +
                                       "): " +
                                       (req.responseText ? req.responseText :
                                                           req.statusText);
        alert(msg);
        throw(msg);
    }

    return req.responseXML;
},

/**
 * Put contents of sentence back to database
 * @param {Element} a_xml sentence to put
 * @param {String} a_url URL to send sentence to
 * @param {String} a_doc document name
 * @param {String} a_sentid sentence id
 */
putContents: function(a_xml, a_url, a_doc, a_sentid)
{
    // clear any old notice out
    $("#alpheios-put-notice").html('');
    // if nothing has changed, do nothing
    // (shouldn't ever happen because save button should be disabled)
    if (this.d_saveCursor == this.d_historyCursor)
      return;

    if (a_url == ('local')) {
        return AlphEdit.ExportContents(a_xml,a_url);
    }
    // send synchronous request to save
    var req = new XMLHttpRequest();
    var builtUrl = a_url.replace('DOC_REPLACE',a_doc);
    builtUrl = builtUrl.replace('S_REPLACE',a_sentid);
    req.open("POST", builtUrl, false);
    // check to see if we need to send a session token
    var sessionToken = $("meta[name='alpheios-sessionTokenName']").attr("content");
    var sessionHeader = $("meta[name='alpheios-sessionHeaderName']").attr("content");
    // Only send the token to same-origin, relative URLs only.
    if (sessionToken && sessionHeader && AlphEdit.sameOrigin(builtUrl)) {
        var csrftoken = AlphEdit.getCookie(sessionToken);
        // Only if we have the cookie
        if (csrftoken) {
            req.setRequestHeader(sessionHeader, csrftoken);
        }
    }
    req.setRequestHeader("Content-Type", "application/xml");
    if (typeof a_xml != 'string') {
        req.send(AlphEdit.serializeToString(a_xml));    
    } else {
        req.send(a_xml);
    }
    if ((req.status != 200) || req.responseXML == null || $(req.responseXML.documentElement).is("error"))
    {
        var httpmsg = req.responseText ? req.responseText : req.statusText;
        var msg = "ERROR!! CHANGES NOT SAVED!<br/>"
        // prefer explicit error messags over general http ones
        if (req.responseXML != null &&  $(req.responseXML.documentElement).is("error"))
        {  
            var links = [];
            $("link",req.responseXML.documentElement).each(function(){
                links.push($(this).attr("href") || $(this).attr("xlink:href"));
            });
            msg = msg + $(req.responseXML.documentElement).text();
            for (var i=0; i<links.length; i++) {
                var regex = new RegExp(links[i].replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1"));
                msg = msg.replace(regex,'<a href="' + links[i] + '">' + links[i] + '</a>')
            }
        } else if (httpmsg) {
            msg = msg + httpmsg;
        } else {
            msg = msg + "Error saving sentence " + a_sentid + " in " + a_doc;
        }
        $("#alpheios-put-notice").addClass("error").html(msg);
        throw(msg);
    } else {
        $("#alpheios-put-notice").removeClass("error").html("Changes Saved!");
    }
    return req.responseXML;
},


// export contents to file
ExportContents: function(a_xml,a_lang,a_format)
{
    var input = $("#sentenceForExport");
    input.val(AlphEdit.serializeToString(a_xml));
    $("input[name=sentenceExportFormat]").val(a_format);
    $("input[name=sentenceExportLang]").val(a_lang);
    $("#exportform").submit();
},

// export display to file
ExportDisplay: function(a_xml,a_lang,a_format)
{
   var input = $("#sentenceForDisplay");
    input.val(AlphEdit.serializeToString(a_xml));
    $("input[name=sentenceDisplayFormat]").val(a_format);
    $("input[name=sentenceDisplayLang]").val(a_lang);
    $("#exportdisplayform").submit();
},

//****************************************************************************
// browser compatibility stuff
//****************************************************************************

/**
 * Get event
 * @param {Event} a_event event passed to handler
 * @returns event to use
 * @type {Event}
 */
getEvent: function(a_event)
{
    return (a_event != null) ? a_event : window.event;
},

/**
 * Get event target
 * @param {Event} a_event event
 * @returns target to use
 * @type {Element}
 */
getEventTarget: function(a_event)
{
    var event = this.getEvent(a_event);
    return (event.target != null) ? event.target : event.srcElement;
},

//****************************************************************************
// miscellaneous
//****************************************************************************

/**
 * Reverse text
 * @param {JQuery} a_nodes nodes to reverse text in
 * @param {String} a_attr attribute, if any, to save old value in
 */
reverseText : function(a_nodes, a_attr)
{
    a_nodes.each(
    function()
    {
        var thisNode = $(this);
        var text = thisNode.text();
        // ignore strings containing letters or digits
        if (text.match(/^[^0-9A-Za-z]*$/))
        {
            // save original form, if desired
            if (a_attr)
                thisNode.attr(a_attr, text);

            // if starts with nbsp, move it to end
            if (text.charAt(0) == '\u00A0')
                text = text.substr(1) + '\u00A0';
            thisNode.text(text.split("").reverse().join(""));
        }
    });
}, 

/**
 * Test that a supplied url has the same origin as the document
 * @param {String} a_url the url to test
 * @return true if the same origin, otherwise false 
 */
sameOrigin: function(a_url) {
    // test that a given url is a same-origin URL
    // url could be relative or scheme relative or absolute
    var host = document.location.host; // host + port
    var protocol = document.location.protocol;
    var sr_origin = '//' + host;
    var origin = protocol + sr_origin;
    // Allow absolute or scheme relative URLs to same origin
    return (a_url == origin || a_url.slice(0, origin.length + 1) == origin + '/') ||
        (a_url == sr_origin || a_url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
        // or any other URL that isn't scheme relative or absolute i.e relative.
        !(/^(\/\/|http:|https:).*/.test(a_url));
},

/**
 * Get a cookie with the supplied name
 * @param {String} name the cookie name
 * @return the value of the cookie or null if not found
 */
getCookie: function(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
},

// this is a horrible hack to prevent the sending of the 
// the xml namespace to perseids because the old version REXML with
// jruby 1.8 has a bug on line 365 of baseparser.rb which looks
// at the attribute value delimiter rather than the attribute itself
// for the value of an namespace declaration for the xml namespace
// not worth patching REXML for right now
serializeToString: function(a_xml) {
  var str = new XMLSerializer().serializeToString(a_xml);    
  str = str.replace(/ xmlns:xml=".*?"/g,'');
  return str;
}

}
