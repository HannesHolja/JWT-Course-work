(function () {

    /* Page variables */
    var eventarray = {};
    var getBut = document.getElementById('getButton');
    var oReq = new XMLHttpRequest();
    var error_div = document.getElementById('error');
    var map_div = document.getElementById('map');
    var map;
    var geocoder;
    var apiURL = 'https://visittampere.fi/api/search?type=event';
    var markers = [];
    var events = [];
    var favorite_list;

    var active_marker;

    var epochNow = new Date();

    var myfavoritesbutton;


    $(document).ready(function () {
        $('.navmenu').offcanvas();
        $('.navmenu').offcanvas({ autohide: false });
        $('.navmenu').offcanvas('hide');

    });

  
    
    /* DEBUG
    
    //CLEAR LOCAL STORAGE
         localStorage.clear();

    */

    /* Listeners */

    /* Google map init */
    (function initMap () {
        map = new google.maps.Map(map_div, {
            zoom: 12,
        });
        

    }())

    var geocoder = new google.maps.Geocoder();

    geocoder.geocode( {'address' : 'Tampere'}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
    }
    });
    /* Google map init END */



        oReq.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                       display_info(oReq.responseText);
            }
            else {
                error_div.innerHTML = "Error fetcihing data";
            }

        } 


        var start = new Date();
        var end = new Date();

        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);


        var url = 'https://visittampere.fi/api/search?type=event&limit=10&start_datetime='+start.getTime()+'&end_datetime='+end.getTime();
        
        oReq.open("GET", url);
        oReq.send();

    
    myfavoritesbutton = document.getElementsByClassName("display-favorites");
    
    myfavoritesbutton[0].addEventListener("click", function() {
        openFavoriteModal();
    });    
    myfavoritesbutton[1].addEventListener("click", function() {
        openFavoriteModal();
    });



    /* EVENT CONSTRUCTOR */
    function Event(item_id, title, description, contact_info, image) {
        if(item_id) this.item_id = item_id;
        if(title) this.title = title;
        if(description) this.description = description;
        if(contact_info) this.contact_info = contact_info;
        if(image) this.image = image;
        this.setEventMarker = function (marker) {
        this.marker = marker;
        };
    }

    function openDirModal(ev) {
        $('#dir-modal').modal('show');

        $('#dir-modal').on('shown.bs.modal', function() {
            
            directions(ev);
        });
    }

    function directions(ev) {
        var directionsService = new google.maps.DirectionsService;
        var directionsDisplay = new google.maps.DirectionsRenderer;
        var dirMap;
        var dirMapdiv = document.getElementById('dir-map');
        var loaderDiv = document.getElementById('loader');


      
        
        (function initMap () {
            dirMap = new google.maps.Map(dirMapdiv, {
            zoom: 15,
        });
            directionsDisplay.setMap(dirMap);
   
        }())



        google.maps.event.addListener(dirMap, 'idle', function () {
            
        });

        geocoder = new google.maps.Geocoder();

        geocoder.geocode( {'address' : 'Kalevantie 4 Tampere'}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            dirMap.setCenter(results[0].geometry.location);
        }
        });


        var request = {
            origin: "Kalevantie 4 Tampere",
            destination: ev.contact_info.address + " " + ev.contact_info.city,
            travelMode: 'DRIVING'
          };
        directionsService.route(request, function(response, status) {
            if (status == 'OK') {
                directionsDisplay.setDirections(response);
            }
        });

    }


    function display_info(data) {
        deleteMarkers();
        events = []; // CLEAR EVENTS OBJECTS
        recieved = JSON.parse(data);

        var content_div = document.getElementById("content");
        while (content_div.firstChild) {
            content_div.removeChild(content_div.firstChild);
        }
        var mobile_content_div = document.getElementById("content_mobile");
        while (mobile_content_div.firstChild) {
            mobile_content_div.removeChild(mobile_content_div.firstChild);
        }


        error_div.innerHTML = "";

        recieved.sort(function(a, b){
            var a_start, b_start;
            if(a.times[0]) {
                a_start = a.times[0].start_datetime;
            }
            else {
                a_start = a.start_datetime;
            }

            if(b.times[0]) {
                b_start = b.times[0].start_datetime;
            }
            else {
                b_start = b.start_datetime;
            }

            if(a_start > b_start){ 
                return 1;
            }
            else if(a_start < b_start) {
                    return -1;
            }
            else {
                    return 0;
            }
            
            

        });

        for(var i = 0; i < recieved.length; ++i) {
            var panel = document.createElement('div');
            var panel_header = document.createElement('div');
            var panel_content = document.createElement('div');

            panel.className = 'event_div panel panel-default';
            document.getElementById('content').appendChild(panel);
            panel.innerHTML = "";

            panel_header.className = 'panel-heading';
            panel_content.className = 'panel-body';

            panel.appendChild(panel_header);
            panel.appendChild(panel_content);

            // CONSTRUCT EVENT OBJECT
            
            var event = new Event(recieved[i].item_id, recieved[i].title, recieved[i].description, 
                                    recieved[i].contact_info, recieved[i].image);

            events.push(event);


            panel_header.innerHTML += "<h2>" + event.title + "</h2><br>";
            if(event.image){
                panel_content.innerHTML += "<img class='img-circle' src='" + event.image.src + "' alt'"+ event.image.title +">";
            }
            panel_content.innerHTML += "<p>" + event.description + "</p>";

            panel_content.innerHTML +=  "<p>";

            if(event.contact_info.address) {
                panel_content.innerHTML +=event.contact_info.address;
                if(event.contact_info.city) {
                    panel_content.innerHTML += " " + event.contact_info.city + "<br>";
                    if(event.image) {
                        placeMarker(event.contact_info.address + " " + event.contact_info.city, event.title, "<h3>"+event.title+"</h3>"+"<p>"+event.description+ "<img class='img-circle' src='" + event.image.src + "' alt'"+ event.image.title +">"+ "</p>", event);
                    }
                    else {
                        placeMarker(event.contact_info.address + " " + event.contact_info.city, event.title, "<h3>"+event.title+"</h3>"+"<p>"+event.description+"</p>", event);
                    }
                }
            }

            if(event.contact_info.link) { 
                panel_content.innerHTML += "<a href='"+ event.contact_info.link + "'>"+ event.contact_info.link +"</a>";
            }
            panel_content.innerHTML +=  "</p>";

           
            if(recieved[i].times[0]) {
                panel_content.innerHTML += "<p>";
                var daysPrinted = 0;
                for(var k = 0; k < recieved[i].times.length; ++k) {
                    if(daysPrinted == 3) {
                        break;
                    }
                    var start_date = new Date(recieved[i].times[k].start_datetime);
                    var end_date = new Date(recieved[i].times[k].end_datetime);

                    if(epochNow < start_date) {
                        panel_content.innerHTML += format_date(start_date) + "-" + format_date(end_date) +"<br>";
                        daysPrinted++;
                    }
                    
                    
                }
                panel_content.innerHTML += "</p>";
            }
            else if(recieved[i].start_datetime) {
                var start_date = new Date(recieved[i].start_datetime);
                var end_date = new Date(recieved[i].end_datetime);
                panel_content.innerHTML += "<p>" + format_date(start_date) + "-" + format_date(end_date) + "</p>";
            }


            panel_content.innerHTML += "<hr><br>";
            var content_buttons = document.createElement('div');
            content_buttons.className = 'content-buttons';

            /* EVENT COMMENTS */

            if(localStorage.getItem(recieved[i].item_id + " COMMENT")) {

                content_buttons.innerHTML = "<p> My comments: " + fetchComment(recieved[i].item_id) + "</p>";
            }

            /* FAVORITE BUTTON */
            var favorite_button = document.createElement('button');
            favorite_button.innerHTML = "Add favorite";
            favorite_button.className = "btn " + recieved[i].item_id+" favorite_button";
            
            content_buttons.appendChild(favorite_button);

            /* SHOW ON MAP BUTTON */

            var center_button = document.createElement('button');
            center_button.innerHTML = "Show on map";
            center_button.className = "btn " + recieved[i].item_id+" center_button";
            
            content_buttons.appendChild(center_button);

            /* DIRECTIONS BUTTON */
            var directions_button = document.createElement('button');

            directions_button.innerHTML = "Fetch directions";
            directions_button.className = "btn " + recieved[i].item_id+" directions_button";
            
            content_buttons.appendChild(directions_button);

            
            panel.appendChild(content_buttons);
         

            document.getElementById('content_mobile').appendChild(panel.cloneNode(true));

            /* BUTTON VARIABLES */
            favorite_button = document.getElementsByClassName(recieved[i].item_id+" favorite_button");

            center_button = document.getElementsByClassName(recieved[i].item_id+" center_button");

            directions_button = document.getElementsByClassName(recieved[i].item_id+" directions_button");

            let itemId = recieved[i].item_id;
            let ev = event;


            /* FAVORITE BUTTON EVENT LISTENERS */

            favorite_button[0].addEventListener("click", function () {addFavorite(itemId, ev);}, true);

            favorite_button[1].addEventListener("click", function () {addFavorite(itemId, ev);}, true);

            /* CHECK IF EVENT IS FAVORITED */

            if(inFavorites(itemId)) {
                favorite_button[0].classList.add("btn-success");
                favorite_button[1].classList.add("btn-success");
                favorite_button[0].innerHTML = "In favorites";
                favorite_button[1].innerHTML = "In favorites";
            }
            else {
                favorite_button[0].classList.remove("btn-success");
                favorite_button[1].classList.remove("btn-success");
            }

            /* SHOW ON MAP BUTTON EVENT LISTENERS */


            center_button[0].addEventListener("click", function () { $('.navmenu').offcanvas('hide'); centerMap(ev);}, true);

            center_button[1].addEventListener("click", function () { $('.navmenu').offcanvas('hide'); centerMap(ev);}, true);


            /* DIRECTIONS BUTTON EVENT LISTENERS */


            directions_button[0].addEventListener("click", function () {openDirModal(ev);}, true);

            directions_button[1].addEventListener("click", function () {openDirModal(ev);}, true);

         

        }

    }

    /* FILTERING FEATURE */

    /* FILTER UI ELEMENTS */

    //DAY SLIDERS
    var day_slider = new Slider("#date-filter", {
        ticks: [1, 2, 3, 4],
        ticks_labels: ["Today", "Tommorow", "In 2 days", "In 3 days"],
        ticks_snap_bounds: 1
    });

    var hamburger_day_slider = new Slider("#hamburger-date-filter", {
        ticks: [1, 2, 3, 4],
        ticks_labels: ["Today", "Tommorow", "In 2 days", "In 3 days"],
        ticks_snap_bounds: 1
    });

    /* these keep day sliders updated */
    day_slider.on('slideStop', function() {

        hamburger_day_slider.setValue(day_slider.getValue());

    });

    hamburger_day_slider.on('slideStop', function() {

        day_slider.setValue(hamburger_day_slider.getValue());

    });


    /*
        0 : MOBILE
        1 : DESKTOP
     */


    //CHECKBOXES
  
    var for_children = document.getElementsByClassName("for-children");
    
    var trade_fair = document.getElementsByClassName("trade-fair");

    var market = document.getElementsByClassName("market");


    
    /* FILTER BUTTON */

    var filter_button = document.getElementById("filter-button");
    var filter_button_mobile = document.getElementById("filter-button-mobile");

    filter_button.addEventListener("click", function () {
        filter("desktop");
    });

    filter_button_mobile.addEventListener("click", function () {
        filter("mobile");
    });



    function filter(type) {

        var URL = apiURL;
        var platform;
        if (type == "desktop") {
            platform = 1;
        }
        else {
            platform = 0;
        }


        if(for_children[platform].checked || trade_fair[platform].checked || market[platform].checked) {

            var tags = 0;
            URL += "&tag=[";
            if(for_children[platform].checked) {
                tags++;
                URL += '"for-children"';
            }

            if(trade_fair[platform].checked) {
                if(tags > 0) {
                    URL += ",";
                }
                URL += '"trade-fair"';
                tags++;
            }

            if(market[platform].checked) {
                if(tags > 0) {
                    URL += ",";
                }
                URL += '"market"';
                tags++;
            }

            URL += "]";

        }

        var d = new Date();
        var start = new Date();
        var end = new Date();

        //TODAY
        if(day_slider.getValue() == 1) {
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            epochNow = start;
        }
        //TOMORROW
        if(day_slider.getValue() == 2) {
            start.setDate(start.getDate() + 1);
            start.setHours(0,0,0,0);
            end.setDate(end.getDate() + 1);
            end.setHours(23,59,59,999);
            epochNow = start;

        }
        //IN 2 DAYS
        if(day_slider.getValue() == 3) {
            start.setDate(start.getDate() + 2);
            start.setHours(0,0,0,0);
            end.setDate(end.getDate() + 2);
            end.setHours(23,59,59,999);
            epochNow = start;

        }
        //IN 3 DAYS
        if(day_slider.getValue() == 4) {
            start.setDate(start.getDate() + 3);
            start.setHours(0,0,0,0);
            end.setDate(end.getDate() + 3);
            end.setHours(23,59,59,999);
            epochNow = start;

        }

        URL += "&start_datetime=" +start.getTime() + "&end_datetime="+end.getTime();

        URL += "&limit=10";

        
        oReq.open("GET", URL);
        oReq.send();

    }

    function deleteFavorite (itemId) {

        var button = document.getElementsByClassName(itemId+" favorite_button");
        if(button[0]){
            button[0].classList.remove("btn-success");
            button[1].classList.remove("btn-success");
        
            button[0].innerHTML = "Add favorite";
            button[1].innerHTML = "Add favorite";
        }
        /* DELETE FROM FAVORITE ARR AND PUSH CHANGES */

        var favoriteArr = JSON.parse(localStorage.getItem("favoriteArr"));
      
        for(var k in favoriteArr) {
            if(favoriteArr[k])
                if(favoriteArr[k].item_id == itemId) {
                    favoriteArr.splice(k, 1);
                    break;
                }
        }

        deleteComment(itemId);

        localStorage.setItem("favoriteArr", JSON.stringify(favoriteArr));
        
        localStorage.removeItem(itemId);

    }

    function inFavorites(itemId) {
        var isin;
        

        isin = localStorage.getItem(itemId);
        if(isin != null) {
            return true;
        }
        else
            return false;
    }

    function openFavoriteModal(ev) {
        $('#favorite-modal').modal('show');

        $('#favorite-modal').on('shown.bs.modal', function() {
            
            displayFavorites();
        });
    }

    function displayFavorites() {
        var favoriteDiv = document.getElementById("favorite-content");

        var favoriteArr = JSON.parse(localStorage.getItem("favoriteArr"));

        if(!favoriteArr) {
            favoriteDiv.innerHTML = "Your favorites is empty";
        }
        else {
            favoriteDiv.innerHTML = "";



            for(var i in favoriteArr) {
            var panel = document.createElement('div');
            var panel_header = document.createElement('div');
            var panel_content = document.createElement('div');

            panel.className = 'event_div panel panel-default';
            favoriteDiv.appendChild(panel);
            panel.innerHTML = "";

            panel_header.className = 'panel-heading';
            panel_content.className = 'panel-body';

            panel.appendChild(panel_header);
            panel.appendChild(panel_content);

            if(favoriteArr[i] == null)
                break;

            panel_header.innerHTML += "<h2>" + favoriteArr[i].title + "</h2><br>";

            if(favoriteArr[i].image){
                panel_content.innerHTML += "<img class='img-circle' src='" + favoriteArr[i].image.src + "' alt'"+ favoriteArr[i].image.title +">";
            }
            panel_content.innerHTML += "<p>" + favoriteArr[i].description + "</p>";

            panel_content.innerHTML +=  "<p>";


            panel_content.innerHTML += "<hr><br>";
            var content_buttons = document.createElement('div');
            content_buttons.className = 'content-buttons';

            /* COMMENT INPUT */
            var comment_text_area = document.createElement('textarea');
            if(localStorage.getItem(favoriteArr[i].item_id + " COMMENT")) {
                comment_text_area.value = fetchComment(favoriteArr[i].item_id);
            }
            else {
                comment_text_area.value = "";
            }

            comment_text_area.className = "form-control " + favoriteArr[i].item_id+" save_comment_textarea";

            /* SAVE COMMENT BUTTON */
            var save_comment_button = document.createElement('button');
            save_comment_button.innerHTML = "Save Comment";
            save_comment_button.className = "btn " + favoriteArr[i].item_id+" save_comment"; 

            /* REMOVE FAVORITE BUTTON */
            var remove_button = document.createElement('button');
            remove_button.innerHTML = "Remove from favorites";
            remove_button.className = "btn btn-danger " + favoriteArr[i].item_id+" remove_button";


            /* APPEND ELEMENTS */
            
            content_buttons.appendChild(comment_text_area);
            content_buttons.appendChild(save_comment_button);
            content_buttons.appendChild(remove_button);

            panel.appendChild(content_buttons);

            remove_button = document.getElementsByClassName(favoriteArr[i].item_id+" remove_button");
            comment_text_area = document.getElementsByClassName(favoriteArr[i].item_id+" save_comment_textarea");
            save_comment_button = document.getElementsByClassName(favoriteArr[i].item_id+" save_comment");

            let itemId = favoriteArr[i].item_id;
            let comment = document.getElementsByClassName(favoriteArr[i].item_id+" save_comment_textarea");


            save_comment_button[0].addEventListener("click", function () {
                saveComment(comment[0].value, itemId);
                return displayFavorites();
            });

            remove_button[0].addEventListener("click", function () {
                deleteFavorite(itemId);
                return displayFavorites();
            });




            }

        }





    }

    function saveComment(comment, itemId) {

        if(comment.length == 0) {
            deleteComment(itemId);
        }
        else {
            localStorage.setItem(itemId+" COMMENT", comment);
        }
    }

    function fetchComment(itemId) {
        if(localStorage.getItem(itemId+" COMMENT") !== null) {
            return localStorage.getItem(itemId+" COMMENT");
        }
        else {
            return "";
        }

    }

    function deleteComment(itemId) {

        if(localStorage.getItem(itemId+" COMMENT")) {
            localStorage.removeItem(itemId+" COMMENT");
        }
    }


    function addFavorite(itemId, event) {
        
        if (inFavorites(itemId)){
            deleteFavorite(itemId);
            return;
        }

        var button = document.getElementsByClassName(itemId+" favorite_button");
        button[0].classList.add("btn-success");
        button[1].classList.add("btn-success");

        button[0].innerHTML = "In favorites";
        button[1].innerHTML = "In favorites";

        /* INSERT INTO FAVORITE ARRAY */

        var favoriteArr = JSON.parse(localStorage.getItem("favoriteArr"));
        if(!favoriteArr) {
            favoriteArr = [];
        }

        var favoriteEvent = {item_id: event.item_id, 
                            title: event.title, 
                            description: event.description, 
                            contact_info: event.contact_info, 
                            image: event.image};

        favoriteArr.push(favoriteEvent);

        localStorage.setItem("favoriteArr", JSON.stringify(favoriteArr));

        /* INSERT ITEM ID INTO ARRAY */
        localStorage.setItem(itemId, event.item_id);
    }

    function clearCenterButtons() {
        var buttons = document.getElementsByClassName("center_button");

        for(var i = 0; i < buttons.length; ++i) {
            buttons[i].classList.remove("btn-success");
        }
    }

    function centerMap(event) {
        clearCenterButtons();
        var button = document.getElementsByClassName(event.item_id+" center_button");
        button[0].classList.add("btn-success");
        button[1].classList.add("btn-success");


        clearMarkers();
        geocoder.geocode( {'address' : event.contact_info.address + " " + event.contact_info.city}, function(results, status) {

            map.setCenter(results[0].geometry.location);
            map.setZoom(15);
            showMarker(event.marker);
        });

        if(active_marker == event.marker) {
            setMapOnAll(map);
            active_marker = null;

            button[0].classList.remove("btn-success");
            button[1].classList.remove("btn-success");
        }
        else {
            active_marker = event.marker;
        }
        
    }



    function deleteMarkers() {
        for (var i = 0; i < markers.length; ++i) {
            markers[i].setMap(null);
        }
        markers = [];
    }

    function showMarker(marker) {
        marker.setMap(map);
    }

    function clearMarkers() {
        setMapOnAll(null);
    }

    function setMapOnAll(m) {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(m);
        }
    }

    function placeMarker(address, title, info, event)
    {
        var marker;
        geocoder.geocode( {'address' : address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            
            marker = new google.maps.Marker({
                position: results[0].geometry.location,
                map: map,
                title: title
            });

            markers.push(marker);

            event.setEventMarker(marker);

            var infowindow = new google.maps.InfoWindow({
                content: info
            });

            marker.addListener('click', function() {
                infowindow.open(map, marker);
            });

        }
        });

    }

    function format_date(date) {
        return date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear() + 
                    "  " + ('0'+date.getHours()).slice(-2) + ":" + ('0'+date.getMinutes()).slice(-2);
    }




}())