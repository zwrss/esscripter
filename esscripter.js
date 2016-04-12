
function clickHandler(e) {
    var res = syncCallES("localhost:9200", "", "GET", "");
    $('#output-response').val(JSON.stringify(res.responseJSON));
}

function execute(e) {
    var server = $('#input-hostname').val();
    var code = "function doExecute() { " + $('#input-code').val() + " } ";
    console.log("compiling: ");
    console.log(code);
    eval(code);
    var result = doExecute();
    console.log("result is: ");
    console.log(result);
    $('#output-response').val(JSON.stringify(result, null, 2));
}

function syncCallES(server, url, method, data) {

    url = constructESUrl(server, url);
    var uname_password_re = /^(https?:\/\/)?(?:(?:(.*):)?(.*?)@)?(.*)$/;
    var url_parts = url.match(uname_password_re);

    var uname = url_parts[2];
    var password = url_parts[3];
    url = url_parts[1] + url_parts[4];
    console.log("Calling " + url + "  (uname: " + uname + " pwd: " + password + ")");
    if (data && method == "GET") method = "POST";

    var response = $.ajax({
        url: url,
        data: method == "GET" ? null : data,
        password: password,
        username: uname,
        crossDomain: true,
        type: method,
        dataType: "json",
        async: false
    });

    return response.responseJSON;
}

function callES(server, url, method, data, successCallback, completeCallback) {

    url = constructESUrl(server, url);
    var uname_password_re = /^(https?:\/\/)?(?:(?:(.*):)?(.*?)@)?(.*)$/;
    var url_parts = url.match(uname_password_re);

    var uname = url_parts[2];
    var password = url_parts[3];
    url = url_parts[1] + url_parts[4];
    console.log("Calling " + url + "  (uname: " + uname + " pwd: " + password + ")");
    if (data && method == "GET") method = "POST";

    $.ajax({
        url: url,
        data: method == "GET" ? null : data,
        password: password,
        username: uname,
        crossDomain: true,
        type: method,
        dataType: "json",
        complete: completeCallback,
        success: successCallback
    });
}

function constructESUrl(server, url) {
    if (url.indexOf("://") >= 0) return url;
    if (server.indexOf("://") < 0) server = "http://" + server;
    if (server.substr(-1) == "/") {
        server = server.substr(0, server.length - 1);
    }
    if (url.charAt(0) === "/") url = url.substr(1);

    return server + "/" + url;
}

var es = {

    search: function (query = null, index = null, type = null) {
        var server = $('#input-hostname').val();
        var url = ""
        if (index != null) {
          url += ("/" + index);
          if (type != null) {
            url += ("/" + type);
          }
        }
        url += "/_search";
        return syncCallES(server, url, "POST", query == null ? null : JSON.stringify(query));
    },

    get: function (index, type, id) {
        var server = $('#input-hostname').val();
        var url = index + "/" + type + "/" + id;
        return syncCallES(server, url, "GET", null);
    },

    info: function () {
        var server = $('#input-hostname').val();
        return syncCallES(server, "", "GET", null);
    },

    index: function (index, type, body, id = null, routing = null) {
        var server = $('#input-hostname').val();
        var url = index + "/" + type;
        if (id != null) {
            url += ("/" + id);
            if (routing != null) {
                url += ("?routing=" + routing)
            }
        }
        return syncCallES(server, url, "POST", JSON.stringify(body));
    },

     scan: function(query, callback, index = null, type = null) {
         var server = $('#input-hostname').val();
         var url = "";
         if (index != null) {
             url += ("/" + index);
             if (type != null) {
                 url += ("/" + type);
             }
         }
         url += "/_search?scroll=1m";
         var url_scroll = "/_search/scroll?scroll=1m"
         console.log("calling es first time in scroll")
         var result = syncCallES(server, url, "POST", JSON.stringify(query));
         var scrollId = result._scroll_id;
         var hits = result.hits.hits;
         var getChunk = function () {
             console.log("getting scroll chunk")
             var result = syncCallES(server, url_scroll, "POST", scrollId);
             scrollId = result._scroll_id;
             hits = result.hits.hits;
         };
         while(hits.length > 0) {
             callback(hits);
             getChunk(scrollId);
         }
     }

};

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('button').addEventListener('click', execute);
});