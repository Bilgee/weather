$(function(){

    /* 設定 */

    var DEG = 'c';  // c celsius, f fahrenheit

    var weatherDiv = $('#weather'),
        weatherList = $('#weatherList'),
        location = $('p.location');

    // geolocationをサポート？
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError);
    }
    else{
        showError("Your browser does not support Geolocation!");
    }

    // ユーザの位置情報を利用してOpenWeatherに渡し、地名と天気予報をゲット

    function locationSuccess(position) {

        try{
            // キャッシュ
            var cache = localStorage.weatherCache && JSON.parse(localStorage.weatherCache);
            var d = new Date();

            // キャッシュが新しいか？
            if(cache && cache.timestamp && cache.timestamp > d.getTime() - 30*60*1000){

                // Get the offset from UTC (turn the offset minutes into ms)
                var offset = d.getTimezoneOffset()*60*1000;
                var city = cache.data.city.name;
                var country = cache.data.city.country;

                $.each(cache.data.list, function(){
                    // 地方時刻をゲット
                    var localTime = new Date(this.dt*1000 - offset);
                    var dayName = moment(localTime).calendar().split(" ");
                    
                        addWeather(
                            this.weather[0].icon,
                            dayName[0],   // moment.jsを利用
                            this.weather[0].main + ' <span>' + convertTemperature(this.temp.max) + '&deg' +DEG+
                                                    '/' + convertTemperature(this.temp.min) + '&deg'+ DEG+'</span>'
                        );
                });
                // 位置情報を追加
                location.html('<span class="genericon genericon-location"></span>' + city+', '+country+'');
                weatherDiv.addClass('loaded');
                
            }

            else{
                var weatherAPI = 'http://api.openweathermap.org/data/2.5/forecast/daily?lat='+position.coords.latitude+
                                    '&lon='+position.coords.longitude+'&cnt=5&callback=?';
                                  
                $.getJSON(weatherAPI, function(response){                    
                    localStorage.weatherCache = JSON.stringify({
                        timestamp:(new Date()).getTime(),   // getTime() returns milliseconds
                        data: response
                    });
                    // 関数をもう一回呼び出す
                    locationSuccess(position);
                });
            }

        }
        catch(e){
            showError("We can't find information about your city!");
            window.console && console.error(e);
        }
    }
    function addWeather(icon, day, condition){
        var markup;
        if( day === "Today"){
            markup = '<li>'+
                '<img src="images/icons/'+ icon +'.png" />'+
                ' <p class="day today">'+ day +'</p> <p class="cond today">'+ condition +
                '</p></li>';
        }else{
            markup = '<li>'+
                '<img src="images/icons/'+ icon +'.png" />'+
                ' <p class="day">'+ day +'</p> <p class="cond ">'+ condition +
                '</p></li>';
        }
        

        weatherList.append(markup);
    }

    /* エラーハンドラー*/

    function locationError(error){
        switch(error.code) {
            case error.TIMEOUT:
                showError("A timeout occured! Please try again!");
                break;
            case error.POSITION_UNAVAILABLE:
                showError('We can\'t detect your location. Sorry!');
                break;
            case error.PERMISSION_DENIED:
                showError('Please allow geolocation access for this to work.');
                break;
            case error.UNKNOWN_ERROR:
                showError('An unknown error occured!');
                break;
        }

    }

    function convertTemperature(kelvin){
        // Celsius or Fahrenheit　? 
        return Math.round(DEG == 'c' ? (kelvin - 273.15) : (kelvin*9/5 - 459.67));
    }

    function showError(msg){
        weatherDiv.addClass('error').html(msg);
    }

});