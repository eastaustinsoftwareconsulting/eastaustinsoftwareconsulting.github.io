(function()
{
    // find the height and width of the browser
    var browser_height = 0;
    var browser_width = 0;

    // set the sizes of the cover images
    // this is both landscapes and portraits
    var landscape_img_sizes = [1920, 1366, 1024, 768, 480, 320];
    var portrait_img_sizes = [1080, 1024, 414, 375, 320];

    // bool, will set up the animation on the intro section, if required
    var show_intro_section = true;

    /*
        cross browser js polyfills
    */
    var cross_browser_funcs = new function()
    {
        /*
            return the inner width of the client
        */
        this.inner_width = function()
        {
            return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;;
        };

        /*
            return the inner height of the client
        */
        this.inner_height = function()
        {
            return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        };
        
        /*
            check to see if an element is in the view port
            this is just a partial (not full)

            find the first one that is partially in the viewport
            to accomplish this, we include the size of the element in the calculation
            which does not force it to be completely within the window

            @param: element     => the element to check to see if it is visible
            @returns: bool      => true if element is at least partially visible
        */
        this.in_viewport = function(element)
        {
            // get the bounding rect, this shows the position
            // of the element as well as the size on the page
            var rect = element.getBoundingClientRect();

            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (cross_browser_funcs.inner_height() + rect.height) &&
                rect.right <= (cross_browser_funcs.inner_width() + rect.width)
            );
        };

        /*
            polyfill to set textContent
            this ensures cross browser for IE8 and lower

            @param: element         => element to change out the text of
            @param: text            => the text to set
        */
        this.set_text_content = function(element, text)
        {
            try
            {
                // start with text content, most supported
                element.textContent = text;
            }
            catch (e)
            {
                try
                {
                    // didn't work...
                    // we should have inner text
                    element.innerText = text;
                }
                catch (e) { }
            }
        };

        /*
            polyfill the Number.isInteger extension function
            which is available in chrome, ff, etc. but not IE
            @param: value           => the value to test to see if it is an int or not
            @returns: bool          => whether or not the value is an integer
                                        true on int
                                        false on anything that isn't an int, including NaN, null, strings, doubles, and infinity
        */
        this.is_integer = function(value)
        {
            // check to see if we have the native function
            if (Number.isInteger)
                return Number.isInteger(value);

            // the native function is not available
            // we have to figure this out for ourselves...
            return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
        };

        // ** TODO **
        //  => Element.classList.add        (IE <10?)
        //  => Element.classList.remove     (IE <10?)
    };

    /*
        function to set the height of a section to the height of the browser
        this will ensure we don't have overlap between sections
        when we don't want there to be any
        @param: section             => the section to set the height of, HTMLElement
    */
    var set_section_height = function(section)
    {
        // make sure we have valid input
        if (section == null)
            return;

        // is this IE?
        if (is_ie_or_edge)
        {
            // we need to set the height for IE and edge
            // since min-height does not work properly
            // for our flexbox
            section.style.height = browser_height + 'px';

            // TODO: measure stuff, set the height to fill the data...
        }

        // set the height of the section (min-height, for non-IE)
        section.style.minHeight = browser_height + 'px';
    };

    /*
        use regular expression to test the user agent to detect IE or edge
        @returns: bool          => true if the browser is identifying as IE or edge
    */
    var is_ie_or_edge = (function()
    {
        // get the user agent
        var user_agent = navigator.userAgent;

        // check for a match on these regexes
        // that will match IE or edge
        var regexes = [
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer
            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i,                        // IE11
            /(edge)\/((\d+)?[\w\.]+)/i                                          // Microsoft Edge
        ];

        // check for matches
        // by iterating on our regular expressions
        for (var i = 0, ilen = regexes.length; i < ilen; i++)
        {
            // check for a match here
            // the match will be either null (doesn't exist)
            // or it will be an array (does exist)
            if (regexes[i].exec(user_agent) != null)
                return true;
        }

        // not ie, could not match on our regexes
        return false;
    })();

    /*
        function to determine if we have a portrait or landscape
        oriented device or element

        @param: width           => the width of the element or window
        @param: height          => the height of the element or window
        @returns: Bool          => true if we are landscape, false if we are portrait
    */
    var is_landscape = function(width, height)
    {
        // if the width is greater, then we are landscape
        // we will default to landscape in the case of a tie
        return width >= height;
    };

    /*
        function to find the best image to fill our element
            - design animation: this is the simulated fw window
            - cover: the browser size

        @param: width           => the width of what we are filling with the image
        @param: height          => the height of what we are filling with the image
        @returns: String        => an image url to set the background image of the element with
    */
    var find_best_image = function(width, height)
    {
        // initialize the images that we have
        var img_sizes = [];

        // initialize the mode the screen is in
        var screen_mode = '';

        // is this in portrait or landscape mode
        // for desktop screens, we will usually be in landscape
        // phones will usually be in portrait
        // check to see if the device has a greater width than height
        // and set the prefix for our cover image accordingly
        // as well as the image sizes
        if (is_landscape(width, height))
        {
            // landscape
            screen_mode = 'l';

            // set the image sizes
            img_sizes = landscape_img_sizes;
        }
        else
        {
            // portrait
            screen_mode = 'p';

            // set the image sizes
            img_sizes = portrait_img_sizes;
        }

        // iterate on the image sizes in reverse
        for (var i = 0; i < img_sizes.length; i++)
        {
            // does this one fit? 
            // we want the biggest and baddest possible
            if (width < img_sizes[i])
                continue;

            // we don't need to do this again, we found the best fit
            // return here
            return 'img/cover' + img_sizes[i] + screen_mode + '.png';
        }
    };

    /*
        function to determine if we should animate
        @returns: Bool          => whether or not we should run the intro
                                    true:   run the intro, we have the height and orientation required
                                    false:  screen does not match our criteria
    */
    var should_animate = function()
    {
        // do we have the skip animation search
        if (window.location && window.location.search == '?skip=1')
            return false;

        // are we in landscape or portrait?
        if (!is_landscape(browser_width, browser_height))
            return false;

        // we are landscape, is our height greater than 600px?
        if (browser_height < 600)
            return false;

        // okay, we can run the animation
        return true;
    };

    /*
        function to run the intro section
        this will only show on browsers that are large
        enough to support it
    */
    var intro_section = function()
    {
        // find the intro element, this is the container
        var intro_element = document.getElementById('intro');

        /*
            function to show the other sections of the page
            these will be hidden on load and need to be shown
            regardless if we are going through our animation or not

            this will be called immediately when our screen does not support animation
            or after the animation has concluded

            @param: watched_through     => whether or not the intro was completed or was skipped
                                            true:   we watched the whole thing
                                            false:  skipped or not started
        */
        var finalize_intro = function(watched_through)
        {
            // find all the sections
            var sections = document.getElementsByTagName('section');

            // show the other sections
            for (var i = 0; i < sections.length; i++)
            {
                // the only one that shouldnt be flex 
                // is the intro
                // we need to skip it
                if (sections[i].getAttribute('id') == 'intro')
                    continue;

                // this is one of the other sections
                // it can be flexed
                sections[i].style.display = 'flex';
            }

            // hide the intro section
            intro_element.style.display = 'none';
        };

        // do we need this?
        // if the browser isn't the right size (e.g.: mobile)
        // then we will skip this part
        if (!show_intro_section)
        {
            // finalize the intro, which will show our sections
            finalize_intro(false);
            return;
        }

        // find the elements that we need
        var intro_design = document.getElementById('intro_design');
        var intro_develop = document.getElementById('intro_develop');
        var intro_deploy = document.getElementById('intro_deploy');

        // control var, this will allow the user to skip the animation
        // should they so desire. the control var will finish the animation asap
        var intro_can_run = true;

        /*
            function to handle clicks on the skip intro button
            this will move passed the animation
        */
        var on_skip_intro_click = function()
        {
            // remove the click handler, we only need this to fire once
            skip_animation.removeEventListener('click', on_skip_intro_click);

            // update the control variable to stop the animation
            // as soon as we can
            intro_can_run = false;

            // finalize the intro
            // this will show the other sections
            // and hide the intro section
            finalize_intro();
        };

        /*
            function to show the correct block
            this will take in the step that we are animating
            and show that div, while hiding the others
        */
        var show_correct_view = function(view_index)
        {
            // find the right one to show
            // the rest are hidden
            //  0 = design
            //  1 = develop
            //  2 = deploy  
            intro_design.style.display = (view_index == 0) ? 'block' : 'none';
            intro_develop.style.display = (view_index == 1) ? 'block' : 'none';
            intro_deploy.style.display = (view_index == 2) ? 'block' : 'none';
        };

        /*
            function to simulate typing within the browser
            this will be used by the design and develop portions
            of the animation
            @param: element         => the dom element to append text to
            @param: text            => the text that we want to write to the element
            @param: speed_factor    => an int that is the max time between keystrokes within the rand (0 < x < speed_factor)
            @param: parent_scroll   => number of parents to traverse to ensure proper scrolling (-1 if this is not required)
            @param: callback        => function to run when the entire string is printed
        */
        var simulate_typing = function(element, text, speed_factor, parent_scroll, callback)
        {
            // make sure the element exists and we have text to write
            if (!element || !text.length)
            {
                // bad input
                callback();
                return;
            }

            // create a timeout var, this will be cleared
            // each time the recursive function runs
            // to make sure we don't double call
            var typing_timeout = 0;

            // hold the length of the string
            var len = text.length;

            /*
                function that will be called recursively
                to build the string
                @param: index           => the location in the string that we need to print to the dom element
            */
            var recursive_type = function(index)
            {
                // clear any timeout, make sure this only fires once per timeout
                clearTimeout(typing_timeout);

                // make sure we still can run
                // check to see if we have exceeded the length of the string
                if (!intro_can_run || index++ >= len)
                {
                    // set the text
                    cross_browser_funcs.set_text_content(element, text);

                    // done, it's all been written
                    callback();
                    return;
                }

                // set the text for the element
                // as a substring of the current position
                cross_browser_funcs.set_text_content(element, text.substring(0, index));

                // check to see if we have scrolling to do
                if (parent_scroll > -1)
                {
                    // there is a chance we need to scroll this window
                    // we could have a window with a short height
                    // and we need to auto scroll it to make it work

                    // make sure we are scrolled to the bottom
                    // we need to get element parent that contains our scrollbars
                    var parent_node = element;

                    // traverse up the element to find the right node
                    for (var i = 0; i < parent_scroll; i++)
                        parent_node = parent_node.parentNode;

                    // set the parent scroll to ensure we are at the bottom
                    // might be an issue on smaller screens
                    parent_node.scrollTop = parent_node.scrollHeight;
                }

                // create a timeout to move to the next character
                // we will randomize the interval to seem more organic
                typing_timeout = setTimeout(function() { recursive_type(index); }, Math.round(Math.random() * speed_factor));
            };

            // start at 0
            recursive_type(0);
        };

        /*
            function to initialize the design section
            of the intro

            this will detect the fonts and run the design animation
            @param: callback            => function to run when the design is complete
        */
        var design_init = function(callback)
        {
            /*
                function that controls the changing of the font
                in the design animation
            */
            var design_text_font_changer = function(callback)
            {
                // find the design text, this is the element we will be changing
                var design_text_ele = document.getElementById('intro_design_text');

                // list of fonts available
                var fonts = [];

                /*
                    function to determine what fonts are available to us to change
                    which will allow us to randomize the font selection process
                    on the screen in the animation
                */
                var get_fonts = function()
                {
                    /*  *
                        * JavaScript code to detect available availability of a
                        * particular font in a browser using JavaScript and CSS.
                        *
                        * Author : Lalit Patel
                        * Website: http://www.lalit.org/lab/javascript-css-font-detect/
                        * License: Apache Software License 2.0
                        *          http://www.apache.org/licenses/LICENSE-2.0
                        * Version: 0.15 (21 Sep 2009)
                        *          Changed comparision font to default from sans-default-default,
                        *          as in FF3.0 font of child element didn't fallback
                        *          to parent element if the font is missing.
                        * Version: 0.2 (04 Mar 2012)
                        *          Comparing font against all the 3 generic font families ie,
                        *          'monospace', 'sans-serif' and 'sans'. If it doesn't match all 3
                        *          then that font is 100% not available in the system
                        * Version: 0.3 (24 Mar 2012)
                        *          Replaced sans with serif in the list of baseFonts
                    */

                    /**
                        * Usage: d = new Detector();
                        *        d.detect('font name');
                        */
                    var Detector = function()
                    {
                        // a font will be compared against all the three default fonts.
                        // and if it doesn't match all 3 then that font is not available.
                        var baseFonts = ['monospace', 'sans-serif', 'serif'];

                        //we use m or w because these two characters take up the maximum width.
                        // And we use a LLi so that the same matching fonts can get separated
                        var testString = "mmmmmmmmmmlli";

                        //we test using 72px font size, we may use any size. I guess larger the better.
                        var testSize = '72px';

                        var h = document.getElementsByTagName("body")[0];

                        // create a SPAN in the document to get the width of the text we use to test
                        var s = document.createElement("span");
                        s.style.fontSize = testSize;
                        s.innerHTML = testString;
                        var defaultWidth = {};
                        var defaultHeight = {};
                        for (var index in baseFonts)
                        {
                            //get the default width for the three base fonts
                            s.style.fontFamily = baseFonts[index];
                            h.appendChild(s);
                            defaultWidth[baseFonts[index]] = s.offsetWidth; //width for the default font
                            defaultHeight[baseFonts[index]] = s.offsetHeight; //height for the defualt font
                            h.removeChild(s);
                        }

                        function detect(font)
                        {
                            var detected = false;
                            for (var index in baseFonts)
                            {
                                s.style.fontFamily = font + ',' + baseFonts[index]; // name of the font along with the base font for fallback.
                                h.appendChild(s);
                                var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
                                h.removeChild(s);
                                detected = detected || matched;
                            }
                            return detected;
                        }

                        this.detect = detect;
                    };

                    // initialize the font detector
                    var font_detector = new Detector();

                    // create a list of common fonts
                    // we will iterate over these to see if they are present
                    var fonts = [['Helvetica'], ['Arial'], ['Times New Roman'], ['Times'], ['Courier'], ['Courier New'], ['Verdana'], ['Tahoma'], ['Avant Garde'], ['Impact'], ['Bookman'], ['Georgia'], ['Lucida']];

                    // iterate on the fonts to see which ones are available
                    // this will add an index to each sub-array that tells
                    // us whether or not the font is on the computer and can be used
                    for (var i = 0; i < fonts.length; i++)
                        fonts[i][1] = font_detector.detect(fonts[i][0]);

                    // return only the fonts that we have
                    // create a new array and filter
                    var return_fonts = [];

                    // iterate and push
                    for (var i = 0; i < fonts.length; i++)
                    {
                        // if we have the font, then push it
                        if (fonts[i][1])
                            return_fonts.push(fonts[i][0]);
                    }

                    // send out the array of fonts that are on the computer
                    return return_fonts;
                };

                /*
                    function to iterate and change the fonts
                    this will give the impression that we are designing the fonts
                    on the fly

                    @param: callback            => function to run once we have completed
                                                    the fonts animation
                */
                var iterate_fonts = function(callback)
                {
                    // set a timer between fonts
                    var time_step = 200;

                    // set the max time this should run
                    // this will be updated on each loop
                    var time_remaining = 2400;

                    // set a timeout for the font change
                    var font_timeout = 0;

                    // make sure we don't pick the same font twice in a row
                    var last_font_index = -1;

                    // the current font that we are using
                    // this will help us make sure we don't pick the same one twice
                    var current_font_index = -1;

                    // we should re-position the element during this time as well
                    var is_repositioning = false;

                    /*
                        function to run when we have completed the font changing part
                        this will fire the last text code and then the callback
                    */
                    var on_complete = function()
                    {
                        // set the text to opensans
                        // this is what we really want it to be
                        design_text_ele.style.fontFamily = 'Open Sans';

                        // fire the callback after a short delay
                        setTimeout(callback, 500);
                    };

                    /*
                        function to handle the centering of the design text
                    */
                    var center_design_text = function()
                    {
                        // make sure we don't run this twice
                        if (is_repositioning)
                            return;

                        // set our repositioning flag to ensure we don't
                        // end up here again
                        is_repositioning = true;

                        /*
                            function to handle the end of the transition
                            this should remove the is_moving class
                            and add the has_moved class to the element
                        */
                        var on_transitionend = function()
                        {
                            // remove the handler, we only need this to fire once
                            design_text_ele.removeEventListener('transitionend', on_transitionend);

                            // add the has_moved class
                            // this will hide the cursor and move handles
                            // while keeping the text in the right spot
                            design_text_ele.classList.add('has_moved');

                            // remove the is_moving class
                            // this class shows the move handles and the cursor
                            // as well as moves the design text into the right spot
                            design_text_ele.classList.remove('is_moving');
                        };

                        // add the handler for the transitionend
                        design_text_ele.addEventListener('transitionend', on_transitionend);

                        // add the class to the text element to start the transition
                        // towards the actual center of the page
                        design_text_ele.classList.add('is_moving');
                    };

                    /*
                        function to change the current font
                        this is the recursive function
                        that will control our iterations
                    */
                    var recursive_font_change = function()
                    {
                        // clear the timeout, there should always be one
                        clearTimeout(font_timeout);

                        // make sure that we should continue
                        if (!intro_can_run)
                            return;

                        // update the time
                        time_remaining -= time_step;

                        // make sure that we have more fonts to change
                        // this is an additional check in case of js wonkiness
                        if (time_remaining <= 0)
                        {
                            // we have gone through the whole thing
                            on_complete();
                            return;
                        }

                        // check to see if we should be moving the text
                        if (!is_repositioning && time_remaining <= 1200)
                            center_design_text();

                        // find the new font index
                        // make sure it is different than the previous font index
                        do
                        {
                            // find a random font in our list
                            current_font_index = Math.round(Math.random() * (fonts.length - 1));

                        } while (current_font_index == last_font_index)

                        // we can change the font, set the font family
                        // to our currently random selected font
                        design_text_ele.style.fontFamily = fonts[current_font_index];

                        // make sure that we aren't done here
                        // this should be the primary check
                        if (time_remaining <= time_step)
                        {
                            // we are done with the text changing
                            on_complete();
                            return;
                        }

                        // update the last font, this will be used for the next iteration
                        last_font_index = current_font_index;

                        // set the timeout and call this function again
                        font_timeout = setTimeout(recursive_font_change, time_step);
                    };

                    // start it immediately
                    recursive_font_change();
                };

                // get the fonts available
                fonts = get_fonts();

                // iterate on the fonts
                iterate_fonts(callback);
            };

            /*
                show the icons for the tools that we use for design
                and a little insight into how this page was made visually
                @param: callback            => function to run once we have completed the design process
            */
            var show_design_process = function(callback)
            {
                /*
                    function to set the background color on the design
                    and fire the callback once completed
                */
                var set_background_color = function()
                {
                    // clear the timeout
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // target the design canvas and change background color
                    design_canvas.style.background = '#7396FF';

                    // set the timeout to fire the the next function
                    design_timeout = setTimeout(set_vertical_rule_left, design_step_time);
                };

                /*
                    set the vertical rule on the left to show
                    this starts a transition to simulate the padding on the page
                */
                var set_vertical_rule_left = function()
                {
                    // clear the timeout
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // find the left vertical rule
                    var left_rule = document.getElementById('vertical_rule_left');

                    // move the left rule in, the transition in css
                    // will animate this smoothly
                    if (left_rule)
                        left_rule.style.left = '10%';

                    // set the timeout for the next animation
                    design_timeout = setTimeout(set_vertical_rule_right, design_step_time);
                };

                /*
                    set the vertical rule on the left to show
                    this starts a transition to simulate the padding on the page
                */
                var set_vertical_rule_right = function()
                {
                    // clear the timeout
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // find the right vertical rule
                    var right_rule = document.getElementById('vertical_rule_right');

                    // move the left rule in, the transition in css
                    // will animate this smoothly
                    if (right_rule)
                        right_rule.style.right = '10%';

                    // set the timeout for the next animation
                    design_timeout = setTimeout(add_heading1_to_canvas, design_step_time);
                };

                /*
                    function to add the heading to the canvas
                    this will type out "Teddy Garland"
                */
                var add_heading1_to_canvas = function()
                {
                    // clear the timeout, make sure this only fires once
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // make sure we have the element to write to
                    var heading1_element = document.getElementById('design_cover_heading1');
                    if (heading1_element != null)
                    {
                        // got it

                        // run the typing simulation
                        simulate_typing(heading1_element, "Teddy Garland", 100, -1, function()
                        {
                            // the typing is done, move to the next function
                            design_timeout = setTimeout(add_heading2_to_canvas, design_step_time);
                        });
                    }
                    else
                    {
                        // couldn't find the element, try to continue

                        // set the timeout for the next animation
                        design_timeout = setTimeout(add_heading2_to_canvas, design_step_time);
                    }
                };

                /*
                    function to add the subheading to the canvas
                    this will type out "entrepreneur, developer"
                */
                var add_heading2_to_canvas = function()
                {
                    // clear the timeout, make sure this only fires once
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // make sure we have the element to write to
                    var heading2_element = document.getElementById('design_cover_heading2');
                    if (heading2_element != null)
                    {
                        // got it

                        // run the typing simulation
                        simulate_typing(heading2_element, "entrepreneur, developer", 75, -1, function()
                        {
                            design_timeout = setTimeout(set_background_image, design_step_time);
                        });
                    }
                    else
                    {
                        // couldn't find the element, try to continue
                        design_timeout = setTimeout(set_background_image, design_step_time);
                    }
                };

                /*
                    change the background image to match the background image that we will show below
                    when the animation is done
                */
                var set_background_image = function()
                {
                    // clear the timeout, make sure this only fires once
                    clearTimeout(design_timeout);

                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // what will be the best fit for the cover image?
                    // it is likely that we have an odd size to this element
                    // since we are using percentages and not fixed pixel sizing
                    // but we can do our best here
                    var design_canvas_bounding_box = design_canvas.getBoundingClientRect();

                    // update the css for the background
                    design_canvas.style.backgroundImage = 'url(' + find_best_image(design_canvas_bounding_box.width, design_canvas_bounding_box.height) + ')';
                    design_canvas.style.backgroundRepeat = 'none';
                    design_canvas.style.backgroundSize = 'cover';

                    // this is the last addition
                    // soak in that great image
                    // then fire the global callback
                    // don't need to use the pointer var, we don't want this to stop for any reason
                    setTimeout(callback, design_step_time * 4);
                };

                // find the program window for the design process
                var design_process_window = document.getElementById('intro_design_window');

                // show the design window
                design_process_window.style.display = 'block';

                // we want to show the tool icons now
                var tool_icon_holder = document.getElementById('intro_design_tools');
                if (tool_icon_holder != null)
                    tool_icon_holder.style.display = 'flex';

                // get the canvas
                var design_canvas = document.getElementById('intro_design_canvas');

                // hold a timeout var to make sure we aren't animating two things
                // at the same time
                var design_timeout = 0;

                // set the time that we will wait between actions
                // during the animation
                var design_step_time = 250;

                // start the animation process
                design_timeout = setTimeout(set_background_color, design_step_time);
            };

            // show the intro design
            show_correct_view(0);

            // begin the changing of the font in the design text
            design_text_font_changer(function()
            {
                // make sure that we should continue
                if (!intro_can_run)
                    return;

                // begin showing the visual element of design
                // then fire the provided callback
                show_design_process(callback);
            });
        };

        /*
            function to initialize the develop part of the animation
            @param: callback            => function to run once we've finished the animation
        */
        var develop_init = function(callback)
        {
            // show the intro design
            show_correct_view(1);

            // find the pre where we will type in our code
            var develop_code_pre = document.getElementById('develop_code');

            // verify
            if (develop_code_pre != null)
            {
                // we have it, write some code here
                // plain black and white seems too boring
                // so we'll fill in with some syntax highlighting

                /*
                    function to build the code within the display window
                    this will take in our code objects and build the appropriate html
                    to provide the style in both spacing and syntax highlighting
                    from the code object below

                    the speed will be controlled by the typing simulator
                    so we don't need to handle any timeouts here

                */
                var build_code_snippets = function()
                {
                    // make sure that we should continue
                    if (!intro_can_run)
                        return;

                    // do we still have snippets
                    if (!code_snippets.length)
                    {
                        // no more snippets
                        // no more code to write :(

                        // fire the callback and move on
                        // we want to wait a moment at the end of the code
                        setTimeout(callback, 1000);
                        return;
                    }

                    // shift the first element off the array
                    // that's the one we'll use
                    var current_snippet = code_snippets.shift();

                    // build the code, we need to create the right span
                    // and append it to the pre container
                    // then simulate the typing

                    // create the element
                    var snippet_span = document.createElement('span');

                    // ensure we have the right text set up
                    var text = current_snippet[1];

                    // apply the correct class
                    if (current_snippet[0] == 0)
                    {
                        // 0 = comment
                        snippet_span.className = "comment";
                    }
                    else if (current_snippet[0] == 1)
                    {
                        // 1 = paren, delimiter, curly
                        snippet_span.className = "pdc";
                    }
                    else if (current_snippet[0] == 2)
                    {
                        // 2 = keyword / reserved word
                        snippet_span.className = "keyword";
                    }
                    else if (current_snippet[0] == 3)
                    {
                        // 3 = string literal
                        snippet_span.className = "string";
                    }

                    // make sure we have the right number of tabs or carriage returns

                    // check for carriage returns, these could be any number of returns
                    if (current_snippet[2])
                    {
                        // create a temp string to append to
                        // this will ultimately have all the carriages we need
                        var carriage_string = "";

                        // iterate and add the tab character
                        for (var i = 0; i < current_snippet[2]; i++)
                            carriage_string += "\r\n";

                        // prepend the carriages to our text
                        text = carriage_string + text;
                    }

                    // check for indents, these could be any number of indents
                    if (current_snippet[3] > 0)
                    {
                        // create a temp string to append to
                        // this will ultimately have all the indents we need
                        var indent_string = "";

                        // iterate and add the tab character
                        for (var i = 0; i < current_snippet[3]; i++)
                            indent_string += "\t";

                        // prepend the tab character to our text
                        text = indent_string + text;
                    }

                    // append the snippet to the container
                    develop_code_pre.appendChild(snippet_span);

                    // send the text in with the newly created element to be printed
                    simulate_typing(snippet_span, text, 33, 1, build_code_snippets);
                };

                // create our code...
                //  [ 
                //      [ type, text, carriage, inline tabs ],
                //      [ type, text, carriage, inline tabs ],
                //      ...
                //  ]
                //      => build the parts based on the amount of window space we have
                var code_snippets = [
                    [0, "// everything needs a little js", 0, 0],
                    [0, "// let's get started!", 1, 0],
                    [1, "(", 1, 0],
                    [2, "function", 0, 0],
                    [1, "()\r\n{", 0, 0],
                    [0, "\t// find the design container", 1, 0],
                    [2, "\tvar ", 1, 0],
                    [1, "intro_design = document.getElementById(", 0, 0],
                    [3, "'intro_design'", 0, 0],
                    [1, ");", 0, 0],
                    [0, "\t// make sure it exists on the page", 2, 1],
                    [2, "\tif ", 1, 1],
                    [1, "(intro_design == null)", 0, 0],
                    [2, "\t\treturn;", 1, 2],
                    [0, "\t// it exists, show it", 2, 0],
                    [1, "\tintro_design.style.display = ", 1, 0],
                    [3, "'block'", 0, 0],
                    [1, ";", 0, 0],
                    [0, "\t// run the font animation", 2, 0],
                    [0, "\t// then show the application window", 1, 0],
                    [1, "\tfont_animation(", 1, 0],
                    [2, "function", 0, 0],
                    [1, "()\r\n\t{", 0, 0],
                    [0, "\t\t// find the application window", 1, 0],
                    [2, "\t\tvar ", 1, 0],
                    [1, "design_application = document.getElementById(", 0, 0],
                    [3, "'intro_design_window'", 0, 0],
                    [1, ");", 0, 0],
                    [0, "\t\t// ...", 2, 0],
                    [0, "\t\t// ...", 1, 0],
                    [0, "\t\t// check out the source on GitHub for more", 1, 0],
                ];

                // build the snippets
                build_code_snippets();
            }
            else
            {
                // not there...?
                callback();
            }
        };

        /*
            function to initialize the deploy part of the animation
            @param: callback            => function to run once we've finished the animation
        */
        var deploy_init = function(callback)
        {
            // show the intro design
            show_correct_view(2);

            // find the "console" simulator
            var deploy_code_element = document.getElementById('deploy_code');

            // verify we have the element
            if (deploy_code_element != null)
            {
                // create a string that we will print to our "console"
                var deploy_code_string = "reading files...\r\nfound 5 folders and 35 files\r\n\r\ncreating temp work directory...\t\tDONE\r\ncloning files to working directory...\tDONE\r\n\r\n2 files are javascript\r\nminifying and compiling...\t\tDONE\r\n\r\n1 file is html\r\ncompacting...\t\t\t\tDONE\r\n\r\n1 file is css\r\ncompacting...\t\t\t\tDONE\r\n\r\nchecking for changes...\t\t\tDONE\r\n\r\nuploading differential to CDN...\tDONE\r\n\r\ncreate release notes...\t\t\tDONE\r\n\r\nclean temp directory...\t\t\tDONE\r\n\r\nRELEASED";

                // type out our deployment console
                simulate_typing(deploy_code_element, deploy_code_string, 40, 0, function()
                {
                    // we finished typing the deploy script
                    // hold at the bottom for a second and fire the callback
                    setTimeout(callback, 1000);
                });
            }
            else
            {
                // not here? just have to move on
                callback();
            }
        };

        // set the height of the intro
        set_section_height(intro_element);

        // make sure it shows
        intro_element.style.display = 'block';

        // give them the option to skip the animation
        var skip_animation = document.getElementById('skip_intro');
        
        // if we have the skip element, then attach the handler
        // attach to the main container so they don't have to guess where
        // to click to get out of the animation
        if (skip_animation != null)
        {
            // set a timeout here so we are async
            // and we can ensure that the skip button has its animation
            //  (can't skip out on all the animations!)
            setTimeout(function()
            {
                // attach handler
                skip_animation.addEventListener('click', on_skip_intro_click);

                // add the class that will make this visible
                // it will animate in from the left on the bottom of the page
                skip_animation.classList.add('show_skip_option');

            }, 1000);
        }

        // find the application views, this is our program window
        // for the design as well as the development
        var application_views = document.getElementsByClassName('application_view');

        // iterate and set the height on the application views
        // this will make sure that they are a reasonable height
        // so we can see them in our little demo
        for (var i = 0; i < application_views.length; i++)
            application_views[i].style.height = Math.round(0.4 * window.innerHeight) + 'px';

        // initialize the design
        design_init(function()
        {
            // after the design part is complete, run the develop part
            develop_init(function()
            {
                // after the develop part is complete, run the deployment
                deploy_init(function()
                {
                    // finalize the animation
                    // and move to the cover page
                    finalize_intro(true);
                });
            });
        });
    };

    /*
        function to initialize the cover section of the page
        this is the main image, hero, and call to actions
    */
    var cover_section = function()
    {
        // select the cover
        var cover_element = document.getElementById('cover');

        /*
            function to set the background image on the cover photo
            this is based on the width of the browser
        */
        var set_cover_photo_size = function()
        {
            // find the background container
            var container = document.getElementById('background_container');

            // make sure we have the container where we will set the css, else give up
            if (container == null)
                return;
                      
            // set the background on the cover
            container.style.backgroundImage = 'url(' + find_best_image(browser_width, browser_height) + ')';
        };

        // initialize the cover section
        set_section_height(cover_element);

        // find the best image for the background
        set_cover_photo_size();        
    };
    
    /*
        function to initialize and handle the the summary section
    */
    var summary_section = function()
    {
        // select the summary section
        var summary_element = document.getElementById('summary');

        // initialize the summary section height
        set_section_height(summary_element);
    };

    /*
        function to initialize the resume section
        this will show a resume that has a brief and detailed view
        as well as allowing for the download of the resume
        in both styles
    */
    var resume_section = function()
    {
        // find the resume section
        var resume_element = document.getElementById('resume');

        // find the expand/collapse button
        var expand_collapse_button = document.getElementById('expand_collapse');

        // find the expand/collapse text element
        var expand_collapse_text_element = expand_collapse_button.getElementsByClassName('control_button_text')[0];

        // find the details tags, we will monitor these for open and closed
        var detail_tags = resume_element.getElementsByTagName('details');

        // hold the number of detail tags that are open
        // this will start at 0, everything is collapsed
        var open_tags = 0;

        /*
            determine if we have more open or closed detail elements
            @returns: bool          => flag, whether or not there are more open than closed
                                        true:   more are open
                                        false:  more are closed
        */
        var more_details_are_open = function()
        {
            // how many tags are open?
            // vs how many are closed?
            //  => if we are above 50%, this will be 1
            //  => if we are below 50%, this will be 0
            return Math.round(open_tags / detail_tags.length) == 1;
        };

        /*
            function to update the expand/collapse button text and class
            so our user will know what will happen when clicking
        */
        var update_expand_collapse_button = function()
        {
            // are more open or closed
            if (more_details_are_open())
            {
                // we want the button to close things
                expand_collapse_button.classList.add('collapse_all');
                cross_browser_funcs.set_text_content(expand_collapse_text_element, 'Collapse All');
            }
            else
            {
                // we want the button to open things
                expand_collapse_button.classList.remove('collapse_all');
                cross_browser_funcs.set_text_content(expand_collapse_text_element, 'Expand All');
            }          
        };

        /*
            function to handle clicks on the expand/collapse button
            this will change the summary/details to open or closed
            based on whichever is more required

            e.g.:   if there are 2 open and 1 collapsed, it will collapse all
                    if there are 3 closed, it will expand all

            @param: e           => the event that caused this function to fire
        */
        var on_expand_collapse_button_click = function(e)
        {
            // stop this event, we don't want to bubble and we don't want to jump
            e.stopPropagation();
            e.preventDefault();
            
            // how many tags are open?
            var more_are_open = more_details_are_open();

            // iterate on the tags, we will need to set this to the opposite
            // if more are open, we want them to now be closed
            for (var i = 0, ilen = detail_tags.length; i < ilen; i++)
            {
                // are we opening or closing
                if (!more_are_open)
                {
                    // we have more closed than open => open them

                    // add the open attribute
                    detail_tags[i].setAttribute('open', '');
                }
                else
                {
                    // we have more open than closed => close them

                    // remove the open attribute
                    detail_tags[i].removeAttribute('open');
                }
            }

            // update the counter var
            if (!more_are_open)
            {
                // they are open now
                open_tags = detail_tags.length - 1;
            }
            else
            {
                // they are closed now
                open_tags = 0;
            }

            // update the button
            update_expand_collapse_button();
        };

        /*
            function to run when we have toggled a details element
            to open or closed
            @param: e           => the event that caused the function to fire
        */
        var on_detail_toggle = function(e)
        {
            // we had a change in one of the details

            // is this open or closed
            // the open attribute will be empty string if it is open
            // or null if it is closed
            if (e.target.getAttribute('open') == null)
            {
                // null, we are closed
                open_tags--;
            }
            else
            {
                // we are now open
                open_tags++;
            }

            // make sure we haven't screwed up the count
            if (open_tags < 0)
                open_tags = 0;
            else if (open_tags >= detail_tags.length)
                open_tags = detail_tags.length - 1;

            // update the button
            update_expand_collapse_button();
        };

        // attach handler to the expand collapse button
        expand_collapse_button.addEventListener('click', on_expand_collapse_button_click);

        // attach the toggle handler to all detail tags
        for (var i = 0, ilen = detail_tags.length; i < ilen; i++)
            detail_tags[i].addEventListener('toggle', on_detail_toggle);
        
        // IE and edge do not have details/summary elements 
        // that were added in HTML5
        // which is used to toggle between the overview and the detailed
        // version of the resume
        // if we are in IE or edge, we will polyfill
        if (is_ie_or_edge)
        {
            // need to polyfill here

            // add the details-element-polyfill.js script
            var polyfill_script = document.createElement('script');
            polyfill_script.src = 'js/details-element-polyfill.js';
            polyfill_script.type = 'text/javascript';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(polyfill_script, s);
        }

        // initialize the resume section height
        set_section_height(resume_element);
    };

    /*
        function to initialize the contact section of the page
        this is a form that can be used to send a quick message
    */
    var contact_section = function()
    {
        // select the contact section
        var contact_element = document.getElementById('contact');

        // attach handlers to the hidden iframe
        // this will handle our form submit
        var target_iframe = document.getElementById('hidden_iframe');

        /* 
            form submit handler, fires when the iframe has loaded

            handle submits of the contact form
            and change the UI to show the submission was accepted

            reads the global submitted var
            this is set by the head in the js global scope
            and when the submit button is clicked

        */
        var on_iframe_load = function()
        {
            // make sure that we aren't firing this for no reason
            // we will only want to change the ui if the form
            // was actually submitted
            if (!_submitted)
                return;

            // remove the handler, we won't have a situation
            // where this should fire twice
            // only one message per page load
            target_iframe.removeEventListener('load', on_iframe_load);

            // swap out the form with a thank you message
            // that will indicate to the user that we will
            // be in contact

            // find the contact section
            var contact_section = document.getElementById('contact');

            // make sure we have it
            if (contact_section == null)
                return;

            // set the submitted class
            // this will hide the form and show our thank you message
            contact_section.classList.add('submitted');
        };

        if (target_iframe != null)
            target_iframe.addEventListener('load', on_iframe_load);

        // initialize the contact section height
        set_section_height(contact_element);
    };

    /*
        initialize the full page handlers
        this will have global handlers
    */
    var full_page_init = function()
    {
        // var to de-bounce our scrolling
        // and ensure we don't fire too often
        var scroll_animation_requested = false;

        // find the footer
        var footer = document.getElementById('footer');

        // find all sections
        // this will help us determine what color the footer should be
        var sections = document.getElementsByTagName('section');

        // set the globals for window size
        browser_height = cross_browser_funcs.inner_height();
        browser_width = cross_browser_funcs.inner_width();

        /*
            function to run when we have observed scrolling
            this will be de-bounced via request animation frame
            and will show/hide the footer when appropriate
        */
        var on_scroll = function()
        {
            // are we requesting an animation frame?
            // if so, we will handle this scroll event
            // when the animation frame is ready
            if (scroll_animation_requested)
                return;

            // set the flag, we are requesting now
            scroll_animation_requested = true;

            // we need to request a frame
            window.requestAnimationFrame(function()
            {
                // update the footer, if we need to
                // we will do this to start by checking the pageYOffset (alias for scrollY, supported by IE)
                // and making sure that we have cleared the cover page

                // we should also hide the footer if we have fully scrolled
                // to ensure that the submit button can be clicked
                if (window.pageYOffset >= 300 && document.body.scrollHeight - window.pageYOffset - browser_height > 150)
                {
                    // we should show the footer (flexbox)
                    footer.style.display = 'flex';

                    // we have an issue, with our color scheme
                    // there really isn't a color that works well (besides black)
                    // for both the light gray and blue backgrounds
                    // so we will change out the color of the footer
                    // based on the section that it is covering

                    // iterate on the sections in reverse order
                    // starting from bottom to top
                    // and find the first one that is in the view port
                    for (var i = sections.length - 1; i >= 0; i--)
                    {
                        // check to see if this is in the viewport
                        // this would tell us that at least the bottom of the screen
                        // is displaying this section
                        if (!cross_browser_funcs.in_viewport(sections[i]))
                            continue;

                        // we are in the viewport
                        // set the color correctly

                        // read the class list on the section
                        // we have a class for blue and gray
                        var classlist = sections[i].classList;

                        // hold a var for the correct class
                        var correct_class = "on_";

                        // iterate on the classes until we find the one that starts with "section_"
                        // that will give us the color of the section
                        for (var j = 0, jlen = classlist.length; j < jlen; j++)
                        {
                            // is check the index of to make sure this is the right class
                            if (classlist[j].indexOf("section_") != 0)
                                continue;

                            // this is it
                            // set this as the correct class
                            correct_class += classlist[j].replace("section_", "");

                            // we don't need to check any more classes
                            break;
                        }

                        // are we still on the hero?
                        // there is no background color to allow the image to show through
                        if (correct_class == "on_")
                            break;

                        // check to see if we need to make the change
                        // if we have the right class, then we can quit here
                        if (footer.classList.contains(correct_class))
                            break;

                        // need to change the class
                        // not all browsers can take in two params
                        // so remove each possibility with a separate call
                        footer.classList.remove('on_blue');
                        footer.classList.remove('on_gray');
                        
                        // add the correct class
                        footer.classList.add(correct_class);
                    }
                }
                else
                {
                    // we should hide the footer
                    footer.style.display = 'none';
                }

                // reset the flag
                // if we scroll, we can request again
                scroll_animation_requested = false;
            });
        };

        // attach the scroll handler
        window.addEventListener('scroll', on_scroll);

        // should we show the intro animation?
        show_intro_section = should_animate();
    };

    /*
        function to initialize our page
    */
    var page_init = function()
    {
        // initialize all globals
        full_page_init();

        // begin the intro section
        intro_section();

        // begin the cover section
        cover_section();

        // begin summary section
        summary_section();

        // begin resume section
        resume_section();

        // begin contact section
        contact_section();
    };

    // initialize
    page_init();

})();