/**
 * @name        jQuery Slydeshow Plugin
 * @author      Jeremy Cummins
 * @version     1.0
 * @url         http://www.royaldigit.com
 * @license     MIT License
 */

(function ($) {
    'use strict';

    $.fn.slydeshow = function (method, callback) {
        var self = this,
            container,
            duration = 700,
            easing = 'easeOutBack',
            methods,
            slideWidth = $(this).find('.slide-container:first').width(),
            containerWidth = $(this).width(),
            slideIndex = 0,
            slideLimit = $(this).find('.slide-container ul li').size() - 1,
            slides = [],
            currentSlide,
            lastSlide,
            touchDistance = 100,
            touchstartTime,
            touchstartX,
            pillContainer,
            interstitial;

        methods = {
            init : function(options) {
                return this.each(function(){
                    container = $(this);
                    if (options.duration) {
                        duration = options.duration;
                    }
                    if (options.easing) {
                        easing = options.easing;
                    }
                    $(this).find('ul li').each(function () {
                        if (!currentSlide) {
                            currentSlide = $(this);
                            $(this).css({display: 'block', position: 'absolute', width: slideWidth, left: 0, top: 0});
                        } else {
                            $(this).css({display: 'block', position: 'absolute', width: slideWidth, left: containerWidth, top: 0});
                        }
                        slides.push($(this));
                    });
                    methods.createPills(event);
                    methods.enable(event);
                });
            },
            changeCallback : function (selfRef) {
                //Overwritten by user
            },
            enable : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                container.find('.arrow-next').on('click', methods.next);
                container.find('.arrow-prev').on('click', methods.prev);
                container.find('.slide-container').on('touchstart', methods.touchstartHandler);
                container.find('.slide-container').on('touchmove', methods.touchmoveHandler);
                container.find('.slide-container').on('touchend', methods.touchendHandler);
                pillContainer.children().each(function() {
                    $(this).on('click', methods.pillClickHandler);
                });
            },
            disable : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                container.find('.arrow-next').off('click', methods.next);
                container.find('.arrow-prev').off('click', methods.prev);
                container.find('.slide-container').off('touchstart', methods.touchstartHandler);
                container.find('.slide-container').off('touchmove', methods.touchmoveHandler);
                container.find('.slide-container').off('touchend', methods.touchendHandler);
                pillContainer.children().each(function() {
                    $(this).off('click', methods.pillClickHandler);
                });
            },
            next : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                if (!interstitial || interstitial === currentSlide) {
                    slideIndex += 1;
                    if (slideIndex > slideLimit) {
                        slideIndex = 0;
                    }
                }
                methods.moveNext(event);
            },
            moveNext : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                lastSlide = currentSlide;
                lastSlide.stop().animate(
                    {left: -containerWidth},
                    {duration: duration, easing: easing, complete: methods.slideOutCallback}
                );
                currentSlide = (interstitial && currentSlide != interstitial)? interstitial : slides[slideIndex];
                currentSlide.show().css({left: containerWidth}).each(methods.slideAnimateInit).stop().animate(
                    {left: 0},
                    {duration: duration, easing: easing, complete: methods.slideAnimatePlay}
                );
                methods.setPill(event);
            },
            prev : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                if (!interstitial || interstitial === currentSlide) {
                    slideIndex -= 1;
                    if (slideIndex < 0) {
                        slideIndex = slideLimit;
                    }
                }
                methods.movePrev(event);
            },
            movePrev : function (event) {
                event = (!event)? window.event : event;
                event.preventDefault();
                lastSlide = currentSlide;
                lastSlide.stop().animate(
                    {left: containerWidth},
                    {duration: duration, easing: easing, complete: methods.slideOutCallback}
                );
                currentSlide = (interstitial && currentSlide != interstitial)? interstitial : slides[slideIndex];
                currentSlide.show().css({left: -containerWidth}).each(methods.slideAnimateInit).stop().animate(
                    {left: 0},
                    {duration: duration, easing: easing, complete: methods.slideAnimatePlay}
                );
                methods.setPill(event);
            },
            slideOutCallback : function () {
                //Replace html with own html to stop videos from playing when moved offscreen.
                $(this).html($(this).html()).hide();
                if (interstitial && lastSlide === interstitial) {
                    methods.removeInterstitial();
                }
            },
            slideAnimateInit : function () {
                $(this).find('[data-speed]').each(function () {
                        var x = ($(this).attr('data-x-start'))? $(this).attr('data-x-start') : false,
                            y = ($(this).attr('data-y-start'))? $(this).attr('data-y-start') : false,
                            opacity = ($(this).attr('data-opacity-start'))? $(this).attr('data-opacity-start') : false,
                            options = {};
                    if (x) {
                        options.left = x + 'px';
                    }
                    if (y) {
                        options.top = y + 'px';
                    }
                    if (opacity) {
                        options.opacity = opacity;
                    }
                    $(this).css(options).hide();
                });
            },
            slideAnimatePlay : function () {
                $(this).find('[data-speed]').each(function () {
                    var x = ($(this).attr('data-x-end'))? $(this).attr('data-x-end') : false,
                        y = ($(this).attr('data-y-end'))? $(this).attr('data-y-end') : false,
                        speed = $(this).attr('data-speed'),
                        opacity = ($(this).attr('data-opacity-end'))? $(this).attr('data-opacity-end') : false,
                        delay = ($(this).attr('data-delay'))? $(this).attr('data-delay') : 0,
                        easing = ($(this).attr('data-easing'))? $(this).attr('data-easing') : 'linear',
                        options = {};
                    if (x) {
                        options.left = x;
                    }
                    if (y) {
                        options.top = y;
                    }
                    if (opacity) {
                        options.opacity = opacity;
                    }
                    $(this).stop().show().delay(delay).animate(options,
                        {duration: speed, easing: easing});
                });
                currentSlide.stop().animate({left: 0}, {duration: duration, easing: easing});
            },
            touchstartHandler : function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                touchstartTime = new Date().getTime();
                touchstartX = touch.pageX;
            },
            touchmoveHandler : function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0],
                    left = touch.pageX - touchstartX;
                event.preventDefault();
                currentSlide.css({left: left});
            },
            touchendHandler : function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0],
                    touchSpace = touchstartX - touch.pageX;
                if (Math.abs(touchSpace) > touchDistance) {
                    event.preventDefault();
                    if (touchSpace > 0) {
                        methods.next(event);
                    } else {
                        methods.prev(event);
                    }
                } else {
                    currentSlide.animate({left: 0}, {duration: 300, easing: 'easeOutBack'});
                }
            },
            createPills : function () {
                var i, left;
                pillContainer = $('<span class="slideshow-pills"></span>');
                container.append(pillContainer);
                for (i = 0; i < slides.length; i += 1) {
                    pillContainer.append('<span></span>');
                }
                left = Math.abs((containerWidth - pillContainer.width()) / 2);
                pillContainer.css({left: left});
                $(pillContainer.children()[0]).addClass('active');
            },
            setPill : function () {
                $(pillContainer.children()).removeClass('active');
                $(pillContainer.children()[slideIndex]).addClass('active');
                methods.changeCallback(currentSlide);
            },
            pillClickHandler : function (event) {
                var index = $(this).index();
                event = (!event)? window.event : event;
                event.preventDefault();
                if (index === slideIndex) {
                    return;
                }
                if (slideIndex > 0 && index < slideIndex) {
                    if (!interstitial || currentSlide === interstitial) {
                        slideIndex = index;
                    }
                    methods.movePrev(event);
                } else {
                    if (!interstitial || currentSlide === interstitial) {
                        slideIndex = index;
                    }
                    methods.moveNext(event);
                }
            },
            addInterstitial : function (el) {
                methods.removeInterstitial();
                interstitial = $('<li></li>');
                interstitial.append(el);
                interstitial.hide();
                container.find('ul').append(interstitial);
            },
            removeInterstitial : function () {
                if (interstitial) {
                    interstitial.remove();
                    interstitial = undefined;
                }
            }
        };

        this.fn = methods;

        if (typeof callback === 'function') {
            methods.changeCallback = callback;
        }

        if ( methods[method] ) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.init.apply( this, arguments );
        } else {
            $.error('Method ' +  method + ' does not exist on jQuery.slydeshow');
        }
    };
}(jQuery));