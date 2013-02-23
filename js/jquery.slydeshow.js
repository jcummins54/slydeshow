/**
 * @name        jQuery Slydeshow Plugin
 * @author      Jeremy Cummins
 * @version     1.0
 * @url         http://www.royaldigit.com/slydeshow/
 * @license     MIT License
 *
 * Available Options:
 * duration -- Int - time transition takes in milliseconds
 * easing -- String - slide transition easing (see http://easings.net/ for easing examples)
 * arrowContainer -- HTML element - defines element that contains next and previous arrows. Used when arrows must be outside the slydeshow div.
 * touchable -- Boolean - defines whether slideshow responds to touch events
 * touchTarget -- HTML element - defines element to be used as touchable area
 * clickCallback -- Function - method to call on interface click event (will fire on arrow or pill button click)
 * changeCallback -- Function - method to call on slide change complete
 */

(function ($) {
    'use strict';

    $.fn.slydeshow = function (method, callback) {
        var self = this,
            container,
            duration = 700,
            easing = 'easeOutExpo',
            containerWidth = $(this).find('ul:first').width(),
            slideIndex = 0,
            slideLimit = $(this).find('ul:first > li').size() - 1,
            slides = [],
            currentSlide,
            lastSlide,
            outNum = 0,
            outCount = 0,
            touchDistance = 100,
            touchstartTime,
            touchstartX,
            pillContainer,
            arrowContainer,
            isNext = true,
            touchable = true,
            touchTarget,
            interstitial;

        self.fn = {
            init: function (options) {
                return this.each(function () {
                    container = $(this);
                    if(!container.hasClass('slydeshow')) {
                        container.addClass('slydeshow');
                    }
                    if (options.duration) {
                        duration = options.duration;
                    }
                    if (options.easing) {
                        easing = options.easing;
                    }
                    if (options.arrowContainer) {
                        arrowContainer = options.arrowContainer;
                    } else {
                        arrowContainer = container;
                    }
                    if (options.touchable) {
                        touchable = true;
                    }
                    if (options.touchTarget) {
                        touchTarget = options.touchTarget;
                    } else {
                        touchTarget = container.find('ul:first');
                    }
                    if (options.clickCallback && typeof options.clickCallback === 'function') {
                        self.fn.clickCallback = options.clickCallback;
                    }
                    if (options.changeCallback && typeof options.changeCallback === 'function') {
                        self.fn.changeCallback = options.changeCallback;
                    }
                    $(this).find('ul:first > li').each(function () {
                        if (!currentSlide) {
                            $(this).css({display: 'block', position: 'absolute', width: containerWidth, left: 0, top: 0});
                            currentSlide = $(this);
                        } else {
                            $(this).css({display: 'block', position: 'absolute', width: containerWidth, left: containerWidth, top: 0});
                        }
                        slides.push($(this));
                    });
                    self.fn.createPills();
                    self.fn.enable();
                });
            },
            clickCallback: function (slideIndex) {
                //Overwritten by user -- triggered on any button click or touch swipe
            },
            changeCallback: function (currentSlide) {
                //Overwritten by user -- triggered on slide change
            },
            enable: function (event) {
                if (event) {
                    event.preventDefault();
                }
                arrowContainer.find('.arrow-next').on('click', self.fn.next);
                arrowContainer.find('.arrow-prev').on('click', self.fn.prev);
                self.fn.makeTouchable(touchTarget);
                pillContainer.children().each(function () {
                    $(this).on('click', self.fn.pillClickHandler);
                });
            },
            disable: function (event) {
                if (event) {
                    event.preventDefault();
                }
                arrowContainer.find('.arrow-next').off('click', self.fn.next);
                arrowContainer.find('.arrow-prev').off('click', self.fn.prev);
                self.fn.makeUntouchable(touchTarget);
                pillContainer.children().each(function () {
                    $(this).off('click', self.fn.pillClickHandler);
                });
            },
            setTouchtarget: function (el) {
                self.fn.makeUntouchable(touchTarget);
                touchTarget = el;
                self.fn.makeTouchable(touchTarget);
            },
            makeTouchable: function (el) {
                if (touchable) {
                    $(el).on('touchstart', self.fn.touchstartHandler);
                    $(el).on('touchmove', self.fn.touchmoveHandler);
                    $(el).on('touchend', self.fn.touchendHandler);
                }
            },
            makeUntouchable: function (el) {
                $(el).off('touchstart', self.fn.touchstartHandler);
                $(el).off('touchmove', self.fn.touchmoveHandler);
                $(el).off('touchend', self.fn.touchendHandler);
            },
            prepareSlide: function () {
                $(this).find('ul:first > li').css({zIndex: 1});
                currentSlide.css({zIndex: 2});
            },
            next: function (event) {
                if (event) {
                    event.preventDefault();
                }
                isNext = true;
                if (interstitial && lastSlide === interstitial) {
                    self.fn.removeInterstitial();
                }
                if (!interstitial || interstitial === currentSlide) {
                    slideIndex += 1;
                    if (slideIndex > slideLimit) {
                        slideIndex = 0;
                    }
                }
                currentSlide.each(function () {
                    self.fn.slideAnimateOut(this, self.fn.moveNext);
                });
                if (event) {
                    self.fn.clickCallback(slideIndex);
                }
            },
            moveNext: function () {
                lastSlide = currentSlide;
                lastSlide.stop().animate(
                    {left: -containerWidth},
                    {duration: duration, easing: easing, complete: self.fn.slideOutCallback}
                );
                currentSlide = (interstitial && currentSlide !== interstitial) ? interstitial : slides[slideIndex];
                self.fn.prepareSlide();
                currentSlide.show().css({left: containerWidth}).each(self.fn.slideAnimateInit).stop().animate(
                    {left: 0},
                    {duration: duration, easing: easing, complete: self.fn.slideAnimatePlay}
                );
                self.fn.setPill();
            },
            prev: function (event) {
                if (event) {
                    event.preventDefault();
                }
                isNext = false;
                if (interstitial && lastSlide === interstitial) {
                    self.fn.removeInterstitial();
                }
                if (!interstitial || interstitial === currentSlide) {
                    slideIndex -= 1;
                    if (slideIndex < 0) {
                        slideIndex = slideLimit;
                    }
                }
                currentSlide.each(function () {
                    self.fn.slideAnimateOut(this, self.fn.movePrev);
                });
                if (event) {
                    self.fn.clickCallback(slideIndex);
                }
            },
            movePrev: function () {
                lastSlide = currentSlide;
                lastSlide.stop().animate(
                    {left: containerWidth},
                    {duration: duration, easing: easing, complete: self.fn.slideOutCallback}
                );
                currentSlide = (interstitial && currentSlide !== interstitial) ? interstitial : slides[slideIndex];
                self.fn.prepareSlide();
                currentSlide.show().css({left: -containerWidth}).each(self.fn.slideAnimateInit).stop().animate(
                    {left: 0},
                    {duration: duration, easing: easing, complete: self.fn.slideAnimatePlay}
                );
                self.fn.setPill();
            },
            slideOutCallback: function () {
                //Replace html with own html to stop videos from playing when moved offscreen.
                $(this).html($(this).html()).hide();
                if (interstitial && lastSlide === interstitial) {
                    self.fn.removeInterstitial();
                }
            },
            slideAnimateInit: function () {
                $(this).find('[data-speed]').each(function () {
                    var x = ($(this).attr('data-x-start'))? $(this).attr('data-x-start') : false,
                        y = ($(this).attr('data-y-start'))? $(this).attr('data-y-start') : false,
                        opacity = ($(this).attr('data-opacity-start'))? $(this).attr('data-opacity-start') : false,
                        reverse = ($(this).attr('data-reverse'))? $(this).attr('data-reverse') : false,
                        options = {};
                    if (x) {
                        if (reverse && !isNext) {
                            x = -x;
                        }
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
            slideAnimatePlay: function () {
                $(this).find('[data-speed]').each(function () {
                    var x = ($(this).attr('data-x-end'))? $(this).attr('data-x-end') : false,
                        y = ($(this).attr('data-y-end'))? $(this).attr('data-y-end') : false,
                        speed = $(this).attr('data-speed'),
                        opacity = ($(this).attr('data-opacity-end'))? $(this).attr('data-opacity-end') : false,
                        delay = ($(this).attr('data-delay'))? $(this).attr('data-delay') : 0,
                        reverse = ($(this).attr('data-reverse'))? $(this).attr('data-reverse') : false,
                        easing = ($(this).attr('data-easing'))? $(this).attr('data-easing') : 'linear',
                        options = {};
                    if (x) {
                        if (reverse && !isNext) {
                            x = -x;
                        }
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
            slideAnimateOut: function (self, onComplete) {
                outNum = 0;
                outCount = 0;
                $(self).find('[data-speed]').each(function () {
                    var x = ($(this).attr('data-x-out'))? $(this).attr('data-x-out') : false,
                        y = ($(this).attr('data-y-out'))? $(this).attr('data-y-out') : false,
                        speed = ($(this).attr('data-speed-out'))? $(this).attr('data-speed-out') : $(this).attr('data-speed'),
                        opacity = ($(this).attr('data-opacity-out'))? $(this).attr('data-opacity-out') : false,
                        delay = ($(this).attr('data-delay-out'))? $(this).attr('data-delay-out') : 0,
                        reverse = ($(this).attr('data-reverse'))? $(this).attr('data-reverse') : false,
                        easing = ($(this).attr('data-easing-out'))?
                            $(this).attr('data-easing-out')
                            : ($(this).attr('data-easing'))? $(this).attr('data-easing') : 'linear',
                        options = {};
                    if (!x && !y && !opacity) {
                        return;
                    }
                    outNum += 1;
                    if (x) {
                        if (reverse && !isNext) {
                            x = -x;
                        }
                        options.left = x;
                    }
                    if (y) {
                        options.top = y;
                    }
                    if (opacity) {
                        options.opacity = opacity;
                    }
                    $(this).stop().show().delay(delay).animate(options,
                        {duration: speed, easing: easing, complete: function () {
                            self.fn.animateOutComplete(onComplete);
                        }});
                });
                if (outNum === outCount) {
                    onComplete();
                }
            },
            animateOutComplete: function (onComplete) {
                outCount += 1;
                if (outCount >= outNum) {
                    onComplete();
                }
            },
            touchstartHandler: function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0];
                touchstartTime = new Date().getTime();
                touchstartX = touch.pageX;
                container.find('.framecover').hide();
            },
            touchmoveHandler: function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0],
                    left = touch.pageX - touchstartX;
                event.preventDefault();
                currentSlide.css({left: left});
            },
            touchendHandler: function (event) {
                var touch = event.originalEvent.touches[0] || event.originalEvent.changedTouches[0],
                    touchSpace = touchstartX - touch.pageX;
                container.find('.framecover').show();
                if (Math.abs(touchSpace) > touchDistance) {
                    event.preventDefault();
                    if (touchSpace > 0) {
                        self.fn.next(event);
                    } else {
                        self.fn.prev(event);
                    }
                } else {
                    currentSlide.animate({left: 0}, {duration: 300, easing: 'easeOutBack'});
                }
            },
            createPills: function () {
                var i, left;
                pillContainer = $('<span class="slydeshow-pills"></span>');
                container.append(pillContainer);
                for (i = 0; i < slides.length; i += 1) {
                    pillContainer.append('<span></span>');
                }
                left = Math.abs((container.width() - pillContainer.width()) / 2);
                pillContainer.css({left:left});
                $(pillContainer.children()[0]).addClass('active');
            },
            setPill: function () {
                $(pillContainer.children()).removeClass('active');
                $(pillContainer.children()[slideIndex]).addClass('active');
                self.fn.changeCallback(currentSlide);
            },
            pillClickHandler: function (event) {
                var index = $(this).index();
                if (event) {
                    event.preventDefault();
                }
                if (index === slideIndex) {
                    return;
                }
                if (slideIndex > 0 && index < slideIndex) {
                    if (!interstitial || currentSlide === interstitial) {
                        slideIndex = index;
                    }
                    self.fn.movePrev(event);
                } else {
                    if (!interstitial || currentSlide === interstitial) {
                        slideIndex = index;
                    }
                    self.fn.moveNext(event);
                }
                self.fn.clickCallback(slideIndex);
            },
            addInterstitial: function (el) {
                self.fn.removeInterstitial();
                interstitial = $('<li></li>');
                interstitial.append(el);
                interstitial.hide();
                container.find('ul:first').append(interstitial);
            },
            removeInterstitial: function () {
                if (interstitial) {
                    interstitial.remove();
                    interstitial = undefined;
                }
            }
        };

        if (typeof callback === 'function') {
            self.fn.changeCallback = callback;
        }

        if (self.fn[method]) {
            return self.fn[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return self.fn.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.slydeshow');
        }
    };
}(jQuery));