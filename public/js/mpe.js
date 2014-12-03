  var update = function() {
    var h = 0;
    $(".blockcontent").height("auto");

    $(".blockcontent").each( function() {
      if ($(this).height() > h) { h = $(this).height(); };    
    });

    $(".blockcontent").height(h);

    //resize banner image
    var bannerheight = $(".bannerimgholder").width()*0.565;
    if (bannerheight > 470) { bannerheight = 470;}
    $(".bannerimgholder").height(bannerheight);

    //position button banner
    var bannertitlebutton = $(".bannertitleblock").height() - 46;
    $(".bannerbutton").css("top", bannertitlebutton);

    //position button contact
    var contactbuttonblock = $(".contactbuttonblock").height() - 46;
    $(".contactsendbutton").css("top", contactbuttonblock);


    //articleimageblock wide
    $(".imgblockimg").height($(".imgblock").width()*0.275);

    //link image scale
    $(".linkimgholder").height($(".linkimgholder").width()*0.75);

  };

  update();
  window.addEventListener( 'resize', update, false );  


