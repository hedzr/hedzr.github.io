/* ==========================================================================
   jQuery plugin settings and other scripts
   ========================================================================== */

/*

To modify or add your own scripts include them in assets/js/_main.js 
and then rebuild using:

 npm run build:js

See below for more details.
If you add additional scripts to assets/js/plugins/ and would like 
them concatenated with the others, be sure to update the uglify 
script in package.json. Same goes for scripts that you remove.

https://mmistakes.github.io/minimal-mistakes/docs/javascript/

*/

$(document).ready(function() {
  // FitVids init
  $("#main").fitVids();

  // Sticky sidebar
  var stickySideBar = function() {
    var show =
      $(".author__urls-wrapper button").length === 0
        ? $(window).width() > 1024 // width should match $large Sass variable
        : !$(".author__urls-wrapper button").is(":visible");
    if (show) {
      // fix
      $(".sidebar").addClass("sticky");
      $(".sidebar__right").addClass("sticky");
    } else {
      // unfix
      $(".sidebar").removeClass("sticky");
      $(".sidebar__right").removeClass("sticky");
    }
  };

  stickySideBar();

  $(window).resize(function() {
    stickySideBar();
  });

  // Follow menu drop down
  $(".author__urls-wrapper button").on("click", function() {
    $(".author__urls").toggleClass("is--visible");
    $(".author__urls-wrapper button").toggleClass("open");
  });

  // Close search screen with Esc key
  $(document).keyup(function(e) {
    if (e.keyCode === 27) {
      if ($(".initial-content").hasClass("is--hidden")) {
        $(".search-content").toggleClass("is--visible");
        $(".initial-content").toggleClass("is--hidden");
      }
    }
  });

  // Search toggle
  $(".search__toggle").on("click", function() {
    $(".search-content").toggleClass("is--visible");
    $(".initial-content").toggleClass("is--hidden");
    // set focus on input
    setTimeout(function() {
      $(".search-content input").focus();
    }, 400);
  });

  // Smooth scrolling
  var scroll = new SmoothScroll('a[href*="#"]', {
    offset: 20,
    speed: 400,
    speedAsDuration: true,
    durationMax: 500
  });

  // Gumshoe scroll spy init
  if($("nav.toc").length > 0) {
    var spy = new Gumshoe("nav.toc a", {
      // Active classes
      navClass: "active", // applied to the nav list item
      contentClass: "active", // applied to the content

      // Nested navigation
      nested: false, // if true, add classes to parents of active link
      nestedClass: "active", // applied to the parent items

      // Offset & reflow
      offset: 20, // how far from the top of the page to activate a content area
      reflow: true, // if true, listen for reflows

      // Event support
      events: true // if true, emit custom events
    });
    /*function isScrolledIntoView(elem)
    {
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }
    function scroll_to_element_if_not_inside_view(element){
      if($(window).scrollTop() > element.offset().top){
        $('html, body').animate( { scrollTop: element.offset().top }, {duration: 400 } );
      }
    }*/
    function ensureVisible(elem) {
      var p = $(elem).offsetParent(), ph = p.height();

      var ptfc = $(elem).parents('nav.toc').first().children().first();
      var phh = ptfc.height(); // get the toc-header height

      // var docViewTop = $(window).scrollTop();
      // var docViewBottom = docViewTop + $(window).height();

      // var elemTop = $(elem).offset().top;
      // var elemBottom = elemTop + $(elem).height();

      var docViewTop = 0; // p.scrollTop();
      var docViewBottom = docViewTop + ph;

      var elemTop = $(elem).offset().top - ptfc.offset().top;
      var elemBottom = elemTop + $(elem).height();

      if ($(elem).height()>phh) elemBottom = elemTop + phh;

      var ofs = 0;

      var vis = ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
      if (!vis) {
        var pa = $(elem).parents('nav.inner').first();
        ofs = elemTop>0 ? elemBottom+phh-ph : elemTop;// - p.height();
        pa.animate( { scrollTop: ofs }, {duration: 70 } );
      }
      // console.log('vis, ph, phh, elemTop, elemBottom, ofs -> ', vis, ph, phh, elemTop, elemBottom, ofs)
    }
    document.addEventListener('gumshoeActivate', function (event) {
      var li = event.target;
      //var link = event.detail.link;
      //var content = event.detail.content;
      ensureVisible(li);
    }, false);
  }

  $('.page__content').find('a').each(function() {
    var a = $(this);
    var local = location.hostname === this.hostname || !this.hostname.length;
    if (local) {
      a.addClass('local');
    }else if((a.children().length!=1||a.children().first().prop('tagName')!='IMG') && !a.children().first().hasClass('image-link')) {
      a.addClass('external');
      // console.log('external link: ', this.outerHTML, ':', a.attr('target'));
      if (!(a.attr('target'))) // test the attr value is undefined or empty
        a.attr('target', '_blank');
    }
  });

  // add A tag around the images in post while it's not been anchored
  $('.page__content').find('img').each(function() {
    var img = $(this);
    if (img.parent().prop('tagName')!='A'){
      console.log('add A tag for IMG: ', img.attr('src'));
      var anchor = document.createElement("a");
      anchor.className = 'image-link';
      anchor.href = img.attr('src');
      anchor.innerHTML = img[0].outerHTML;
      anchor.title = "Click on image to enlarge it at full screen";
      img.replaceWith(anchor);
    }
  });

  // add lightbox class to all image links
  $(
    "a[href$='.jpg'],a[href$='.jpeg'],a[href$='.JPG'],a[href$='.png'],a[href$='.gif']"
  ).addClass("image-popup");

  // Magnific-Popup options
  $(".image-popup").magnificPopup({
    // disableOn: function() {
    //   if( $(window).width() < 500 ) {
    //     return false;
    //   }
    //   return true;
    // },
    type: "image",
    tLoading: "Loading image #%curr%...",
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">Image #%curr%</a> could not be loaded.'
    },
    removalDelay: 500, // Delay in milliseconds before popup is removed
    // Class that is added to body when popup is open.
    // make it unique to apply your CSS animations just to this exact popup
    mainClass: "mfp-zoom-in",
    callbacks: {
      beforeOpen: function() {
        // just a hack that adds mfp-anim class to markup
        this.st.image.markup = this.st.image.markup.replace(
          "mfp-figure",
          "mfp-figure mfp-with-anim"
        );
      }
    },
    closeOnContentClick: true,
    midClick: true // allow opening popup on middle mouse click. Always set it to true if you don't provide alternative source.
  });

  // Add anchors for headings
  $('.page__content').find('h1, h2, h3, h4, h5, h6').each(function() {
    var id = $(this).attr('id');
    if (id) {
      var anchor = document.createElement("a");
      anchor.className = 'header-link';
      anchor.href = '#' + id;
      anchor.innerHTML = '<span class=\"sr-only\">Permalink</span><i class=\"fa fa-link\"></i>';
      anchor.title = "Permalink";
      $(this).append(anchor);
    }
  });
});

/*function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function scroll_to_element_if_not_inside_view(element){
  if($(window).scrollTop() > element.offset().top){
    $('html, body').animate( { scrollTop: element.offset().top }, {duration: 400 } );
  }
}*/
function ensureVisible(elem) {
  var p = $(elem).offsetParent(), ph = p.height();

  var ptfc = $(elem).parents('nav.toc').first().children().first();
  var phh = ptfc.height(); // get the toc-header height

  // var docViewTop = $(window).scrollTop();
  // var docViewBottom = docViewTop + $(window).height();

  // var elemTop = $(elem).offset().top;
  // var elemBottom = elemTop + $(elem).height();

  var docViewTop = 0; // p.scrollTop();
  var docViewBottom = docViewTop + ph;

  var elemTop = $(elem).offset().top - ptfc.offset().top;
  var elemBottom = elemTop + $(elem).height();

  if ($(elem).height()>phh) elemBottom = elemTop + phh;

  var ofs = 0;

  var vis = ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  if (!vis) {
    var pa = $(elem).parents('nav.inner').first();
    ofs = elemTop>0 ? elemBottom+phh-ph : elemTop;// - p.height();
    pa.animate( { scrollTop: ofs }, {duration: 70 } );
  }
  // console.log('vis, ph, phh, elemTop, elemBottom, ofs -> ', vis, ph, phh, elemTop, elemBottom, ofs)
}