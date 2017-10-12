//-----------------------------Ресайз всея begin
(function(){
    function pageResize(data){
        if(!data.normalSize){
            data.normalSize = {
                width: 1400,
                height: 900
            }
        }
        if(!data.normalFont){
            data.normalFont = 12;
        }
        var win = data.wrapper,
            winWidth = win.width(),
            winHeight = win.height(),
            normalWidth = data.normalSize.width,
            normalHeight = data.normalSize.height,
            ratio = normalWidth/normalHeight,
            normalSize = data.normalFont,
            perc = 1,
            elem = data.resizeElem;
        $(window).resize(function(){
            winWidth = win.width();
            winHeight = win.height();
            var tmpHeight = 0,
                tmpWidth = 0;
            if(ratio < winWidth/winHeight){
                tmpHeight = winHeight;
                tmpWidth = tmpHeight * ratio;

            } else {
                tmpWidth = winWidth;
                tmpHeight = tmpWidth / ratio;
            }
            perc = tmpWidth/normalWidth;
            var newSize = normalSize*perc;
            //if(newSize > 19){
            //    newSize = 19;
            //}
//            if(newSize < 10){
//                newSize = 10;
//            }
            elem.css({
                fontSize: newSize
            });
        });
        $(window).trigger("resize");
    }

    pageResize({
        wrapper: $('.wrapper'),
        resizeElem: $(".js_resizeContent"),
        normalSize: {
            width: 1920,
            height: 1050
        },
        normalFont: 100
    });

})();

//-----------------------------Ресайз всея end
