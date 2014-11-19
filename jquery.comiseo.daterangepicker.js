/*!
 * jQuery UI date range picker widget
 * Copyright (c) 2014 Tamble, Inc.
 * Licensed under MIT (https://github.com/tamble/jquery-ui-daterangepicker/raw/master/LICENSE.txt)
 *
 * Depends:
 *   - jQuery 1.8.3+
 *   - jQuery UI 1.9.0+ (widget factory, position utility, button, menu, datepicker)
 *   - moment.js 2.3.0+
 */

(function($, window, undefined) {

    var uniqueId = 0; // used for unique ID generation within multiple plugin instances

    $.widget('comiseo.daterangepicker', {
        version: '0.3.3',
        options: {
            // presetRanges: array of objects; each object describes an item in the presets menu
            // and must have the properties: text, dateStart, dateEnd.
            // dateStart, dateEnd are functions returning a moment object

            presetRanges: [
                {text: lang.today, dateStart: function() { return moment() }, dateEnd: function() { return moment() } },
                {text: lang.yesterday, dateStart: function() { return moment().subtract('days', 1) }, dateEnd: function() { return moment().subtract('days', 1) } },
                {text: lang.last7Days, dateStart: function() { return moment().subtract('days', 6) }, dateEnd: function() { return moment() } },
                {text: lang.lastWeek, dateStart: function() { return moment().subtract('days', 7).isoWeekday(1) }, dateEnd: function() { return moment().subtract('days', 7).isoWeekday(7) } },
                {text: lang.monthToDate, dateStart: function() { return moment().startOf('month') }, dateEnd: function() { return moment() } },
                {text: lang.previousMonth, dateStart: function() { return moment().subtract('month', 1).startOf('month') }, dateEnd: function() { return moment().subtract('month', 1).endOf('month') } },
                {text: lang.yearTodate, dateStart: function() { return moment().startOf('year') }, dateEnd: function() { return moment() } }
            ],
            presetMenu: true,
            GAMenu: false,
            verticalOffset: 0,
            initialText: lang.selectDateRange, // placeholder text - shown when nothing is selected
            icon: 'ui-icon-triangle-1-s',
            applyButtonText: lang.applyButtonText,
            cancelButtonText: lang.cancelButtonText,
            rangeSplitter: ' - ', // string to use between dates
            dateFormat: 'M d, yy', // displayed date format. Available formats: http://api.jqueryui.com/datepicker/#utility-formatDate
            altFormat: 'yy-mm-dd', // submitted date format - inside JSON {"start":"...","end":"..."}
            mirrorOnCollision: true, // reverse layout when there is not enough space on the right
            applyOnMenuSelect: true, // auto apply menu selections
            autoFitCalendars: true, // override numberOfMonths option in order to fit widget width
            onOpen: null, // callback that executes when the dropdown opens
            onClose: null, // callback that executes when the dropdown closes
            onChange: null, // callback that executes when the date range changes
            datepickerOptions: { // object containing datepicker options. See http://api.jqueryui.com/datepicker/#options
                numberOfMonths: 3,
//				showCurrentAtPos: 1 // bug; use maxDate instead
                maxDate: 0 // the maximum selectable date is today (also current month is displayed on the last position)
            },
            displayErrorFunction: alert
        },

        _create: function() {
            this._dateRangePicker = buildDateRangePicker(this.element, this.options);
        },

        _destroy: function() {
            this._dateRangePicker.destroy();
        },

        open: function() {
            this._dateRangePicker.open();
        },

        close: function() {
            this._dateRangePicker.close();
        },

        setRange: function(range) {
            this._dateRangePicker.setRange(range);
        },

        getRange: function() {
            return this._dateRangePicker.getRange();
        },

        setRange2: function(range) {
            this._dateRangePicker.setRange2(range);
        },

        getRange2: function() {
            return this._dateRangePicker.getRange2();
        },

        setState: function(state) {
            this._dateRangePicker.setState(state);
        },

        getState: function(state) {
            this._dateRangePicker.getState();
        },

        clearRange: function() {
            this._dateRangePicker.clearRange();
        },

        widget: function() {
            return this._dateRangePicker.getContainer();
        }
    });

    /**
     * factory for the trigger button (which visually replaces the original input form element)
     *
     * @param {jQuery} $originalElement jQuery object containing the input form element used to instantiate this widget instance
     * @param {String} classnameContext classname of the parent container
     * @param {Object} options
     */
    function buildTriggerButton($originalElement, classnameContext, options) {
        var $self, id;

        function fixReferences() {
            id = 'drp_autogen' + uniqueId++;
            $('label[for="' + $originalElement.attr('id') + '"]')
                .attr('for', id);
        }

        function init() {
            fixReferences();
            $self = $('<button type="button"></button>')
                .addClass(classnameContext + '-triggerbutton')
                .attr({'title': $originalElement.attr('title'), 'tabindex': $originalElement.attr('tabindex'), id: id})
                .button({
                    icons: {
                        secondary: options.icon
                    },
                    label: options.initialText
                });
        }

        function getLabel() {
            return $self.button('option', 'label');
        }

        function setLabel(value) {
            $self.button('option', 'label', value);
        }

        function reset() {
            $originalElement.val('').change();
            setLabel(options.initialText);
        }

        init();
        return {
            getElement: function() { return $self; },
            getLabel: getLabel,
            setLabel: setLabel,
            reset: reset
        };
    }

    /**
     * factory for the presets menu (containing built-in date ranges)
     *
     * @param {String} classnameContext classname of the parent container
     * @param {Object} options
     * @param {Function} onClick callback that executes when a preset is clicked
     */
    function buildPresetsMenu(classnameContext, options, onClick) {
        var $self,
            $menu;

        function init() {
            $self = $('<div></div>')
                .addClass(classnameContext + '-presets');

            $menu = $('<ul></ul>');

            $.each(options.presetRanges, function() {
                $('<li><a href="#">' + this.text + '</a></li>')
                    .data('dateStart', this.dateStart)
                    .data('dateEnd', this.dateEnd)
                    .click(onClick)
                    .appendTo($menu);
            });

            $self.append($menu);

            $menu.menu()
                .data('ui-menu').delay = 0; // disable submenu delays
        }

        init();
        return {
            getElement: function() { return $self; }
        };
    }

    /**
     * factory for the GA like menu
     *
     * @param {String} classnameContext classname of the parent container
     * @param {Object} options
     * @param {Function} GASelect1Change callback that executes when first select is changed
     * @param {Function} GASelect2Change callback that executes when second select is changed
     * @param {Function} GACheckboxClick callback that executes when checkbox is clicked
     * @param {Function} GAFirstInputClick callback that executes when first input is clicked
     * @param {Function} GAFirstInputChange callback that executes when first input is changed
     * @param {Function} GASecondInputClick callback that executes when second input is clicked
     * @param {Function} GASecondInputChange callback that executes when second input is changed
     * @param {Function} GAThirdInputClick callback that executes when third input is clicked
     * @param {Function} GAThirdInputChange callback that executes when third input is changed
     * @param {Function} GAFourthInputClick callback that executes when fourth input is clicked
     * @param {Function} GAFourthInputChange callback that executes when fourth input is changed
     */
    function buildGAMenu(classnameContext, options, GASelect1Change, GASelect2Change, GACheckboxClick,
                         GAFirstInputClick, GAFirstInputChange, GASecondInputClick, GASecondInputChange,
                         GAThirdInputClick, GAThirdInputChange, GAFourthInputClick, GAFourthInputChange) {
        var $self,
            $menu;

        function init() {
            $self = $('<div></div>')
                .addClass(classnameContext + '-GA');

            $firstSelect = $('<select id="firstSelect"></select>').change(GASelect1Change);

            $('<option value="0">' + lang.custom + '</option>').appendTo($firstSelect);

            $.each(options.presetRanges, function() {
                $('<option>' + this.text + '</option>')
                    .data('dateStart', this.dateStart)
                    .data('dateEnd', this.dateEnd)
                    .appendTo($firstSelect);
            });

            $firstInput = $('<input type="text" id="firstInput" class="GAInput"/>').click(GAFirstInputClick).change(GAFirstInputChange);
            $secondInput = $('<input type="text" id="secondInput" class="GAInput"/>').click(GASecondInputClick).change(GASecondInputChange);

            $self.append('<span>' + lang.period + ' : </span>');
            $self.append($firstSelect);

            $secondBlock = $('<div></div>').addClass('secondBlock');

            $secondBlock.append($firstInput);
            $secondBlock.append('&nbsp;-&nbsp;');
            $secondBlock.append($secondInput);

            $self.append($secondBlock);

            $secondSelect = $('<select id="secondSelect" disabled="disabled" readonly="readonly"></select>').change(GASelect2Change);

            $('<option value="0">' + lang.custom + '</option>').appendTo($secondSelect);

            $.each(options.presetRanges, function() {
                $('<option>' + this.text + '</option>')
                    .data('dateStart', this.dateStart)
                    .data('dateEnd', this.dateEnd)
                    .appendTo($secondSelect);
            });

            $thirdInput = $('<input type="text" id="thirdInput" class="GAInput"/>').click(GAThirdInputClick).change(GAThirdInputChange);
            $fourthInput = $('<input type="text" id="fourthInput" class="GAInput"/>').click(GAFourthInputClick).change(GAFourthInputChange);

            $checkBox = $('<input id="compareTo" type="checkbox"/>').click(GACheckboxClick);

            $self.append($checkBox);
            $self.append('<span>' + lang.compareTo + '</span>');
            $self.append($secondSelect);

            $thirdBlock = $('<div></div>').addClass('thirdBlock');

            $thirdBlock.append($thirdInput);
            $thirdBlock.append('&nbsp;-&nbsp;');
            $thirdBlock.append($fourthInput);

            $self.append($thirdBlock);
        }

        init();
        return {
            getElement: function() { return $self; }
        };
    }

    /**
     * factory for the multiple month date picker
     *
     * @param {String} classnameContext classname of the parent container
     * @param {Object} options
     */
    function buildCalendar(classnameContext, options) {
        var $self,
            range = {start: null, end: null}, // selected range
            range2 = {start: null, end: null},  // selected range2
            state = 0;

        function init() {
            $self = $('<div></div>', {'class': classnameContext + '-calendar ui-widget-content'});

            $self.datepicker($.extend({}, options.datepickerOptions, {beforeShowDay: beforeShowDay, onSelect: onSelectDay}));
            updateAtMidnight();
        }

        // called when a day is selected
        function onSelectDay(dateText, instance) {
            var dateFormat = options.datepickerOptions.dateFormat || $.datepicker._defaults.dateFormat,
                selectedDate = $.datepicker.parseDate(dateFormat, dateText),
                displayedDate = $.datepicker.formatDate(options.dateFormat, selectedDate) ;

            if(options.GAMenu) {
                $('#firstSelect').val(0);
                $('#secondSelect').val(0);
                switch(state) {
                    case 0:
                        $('#firstInput').val(displayedDate);
                        $('#secondInput').val("");
                        range.start = selectedDate;
                        range.end = null;
                        state = 1;
                        $('.GAInput').removeClass('active1 active2');
                        $('#secondInput').addClass('active1');
                        break;
                    case 1:
                        $('#secondInput').val(displayedDate);
                        if(selectedDate < range.start) {
                            range.end = range.start;
                            range.start = selectedDate;
                        } else {
                            range.end = selectedDate;
                        }

                        $('.GAInput').removeClass('active1 active2');
                        if($('#compareTo').prop('checked')) {
                            state = 2;
                            $('#thirdInput').addClass('active2');
                        } else {
                            state = 0;
                            $('#firstInput').addClass('active1');
                        }
                        break;
                    case 2:
                        $('#thirdInput').val(displayedDate);
                        range2.start = selectedDate;
                        range2.end = null;
                        state = 3;
                        $('.GAInput').removeClass('active1 active2');
                        $('#fourthInput').addClass('active2');
                        break;
                    case 3:
                        $('#fourthInput').val(displayedDate);
                        if(selectedDate < range2.start) {
                            range2.end = range2.start;
                            range2.start = selectedDate;
                        } else {
                            range2.end = selectedDate;
                        }

                        state = 0;
                        $('.GAInput').removeClass('active1 active2');
                        $('#firstInput').addClass('active1');
                        break;
                }
            } else {
                if (!range.start || range.end) { // start not set, or both already set
                    range.start = selectedDate;
                    range.end = null;
                } else if (selectedDate < range.start) { // start set, but selected date is earlier
                    range.end = range.start;
                    range.start = selectedDate;
                } else {
                    range.end = selectedDate;
                }
            }

            if (options.datepickerOptions.hasOwnProperty('onSelectDay')) {
                options.datepickerOptions.onSelectDay(dateText, instance);
            }
        }

        // called for each day in the datepicker before it is displayed
        function beforeShowDay(date) {
            var strClass = '';
            if(options.GAMenu) {
                var isDateInRange = (range.start && ((+date === +range.start) || (range.end && range.start <= date && date <= range.end)));
                var isDateInRange2 = (range2.start && ((+date === +range2.start) || (range2.end && range2.start <= date && date <= range2.end)));
                if( isDateInRange && isDateInRange2 ) {
                    strClass = 'green';
                } else if(isDateInRange) {
                    strClass = 'blue';
                } else if(isDateInRange2) {
                    strClass = 'orange';
                }
            } else {
                strClass = range.start && ((+date === +range.start) || (range.end && range.start <= date && date <= range.end)) ? 'ui-state-highlight' : '';
            }
            var result = [
                    true, // selectable
                    strClass
                ],
                userResult = [true, ''];

            if (options.datepickerOptions.hasOwnProperty('beforeShowDay')) {
                userResult = options.datepickerOptions.beforeShowDay(date);
            }

            return [
                result[0] && userResult[0],
                result[1] + userResult[1]
            ];
        }

        function updateAtMidnight() {
            setTimeout(function() {
                refresh();
                updateAtMidnight();
            }, moment().endOf('day') - moment());
        }

        function scrollToRangeStart() {
            if (range.start) {
                $self.datepicker('setDate', range.start);
            }
        }

        function refresh() {
            $self.datepicker('refresh');
            $self.datepicker('setDate', null); // clear the selected date
        }

        function reset() {
            range = {start: null, end: null};
            refresh();
        }

        init();
        return {
            getElement: function() { return $self; },
            scrollToRangeStart: function() { return scrollToRangeStart(); },
            getRange: function() { return range; },
            setRange: function(value) { range = value; refresh(); },
            getRange2: function() { return range2; },
            setRange2: function(value) { range2 = value; refresh(); },
            setState: function(value) { state = value; },
            refresh: refresh,
            reset: reset
        };
    }

    /**
     * factory for the button panel
     *
     * @param {String} classnameContext classname of the parent container
     * @param {Object} options
     * @param {Object} handlers contains callbacks for each button
     */
    function buildButtonPanel(classnameContext, options, handlers) {
        var $self,
            applyButton,
            cancelButton;

        function init() {
            applyButton = $('<button type="button" class="ui-priority-primary"></button>')
                .text(options.applyButtonText)
                .button();
            cancelButton = $('<button type="button" class="ui-priority-secondary"></button>')
                .text(options.cancelButtonText)
                .button();

            $self = $('<div></div>')
                .addClass(classnameContext + '-buttonpanel')
                .append(applyButton)
                .append(cancelButton);

            bindEvents();
        }

        function bindEvents() {
            if (handlers) {
                applyButton.click(handlers.onApply);
                cancelButton.click(handlers.onCancel);
            }
        }

        init();
        return {
            getElement: function() { return $self; }
        };
    }

    /**
     * factory for the widget
     *
     * @param {jQuery} $originalElement jQuery object containing the input form element used to instantiate this widget instance
     * @param {Object} options
     */
    function buildDateRangePicker($originalElement, options) {
        var classname = 'comiseo-daterangepicker',
            $container, // the dropdown
            $mask, // ui helper (z-index fix)
            triggerButton,
            presetsMenu,
            GAMenu,
            calendar,
            buttonPanel,
            isOpen = false,
            autoFitNeeded = false,
            LEFT = 0,
            RIGHT = 1,
            TOP = 2,
            BOTTOM = 3,
            sides = ['left', 'right', 'top', 'bottom'],
            hSide = RIGHT, // initialized to pick layout styles from CSS
            vSide = null;

        function init() {
            triggerButton = buildTriggerButton($originalElement, classname, options);
            if(options.presetMenu) {
                presetsMenu = buildPresetsMenu(classname, options, usePreset);
            }
            if(options.GAMenu) {
                GAMenu = buildGAMenu(classname,
                    options,
                    GASelect1Change,
                    GASelect2Change,
                    GACheckboxClick,
                    GAFirstInputClick,
                    GAFirstInputChange,
                    GASecondInputClick,
                    GASecondInputChange,
                    GAThirdInputClick,
                    GAThirdInputChange,
                    GAFourthInputClick,
                    GAFourthInputChange
                );
            }
            calendar = buildCalendar(classname, options);
            autoFit.numberOfMonths = options.datepickerOptions.numberOfMonths; // save initial option!
            if (autoFit.numberOfMonths instanceof Array) { // not implemented
                options.autoFitCalendars = false;
            }
            buttonPanel = buildButtonPanel(classname, options, {
                onApply: function() {
                    close();
                    setRange();
                },
                onCancel: function() {
                    close();
                    reset();
                }
            });
            render();
            autoFit();
            reset();
            bindEvents();
        }

        function render() {
            $container = $('<div></div>', {'class': classname + ' ' + classname + '-' + sides[hSide] + ' ui-widget ui-widget-content ui-corner-all ui-front'})
                .append($('<div></div>', {'class': classname + '-main ui-widget-content'}));
            if(options.presetMenu) {
                $container.append(presetsMenu.getElement());
            }
            if(options.GAMenu) {
                $container.append(GAMenu.getElement());
            }
            $container.append(calendar.getElement())
                .append($('<div class="ui-helper-clearfix"></div>')
                    .append(buttonPanel.getElement()))
                .hide();
            $originalElement.hide().after(triggerButton.getElement());
            $mask = $('<div></div>', {'class': 'ui-front ' + classname + '-mask'}).hide();
            $('body').append($mask).append($container);
        }

        // auto adjusts the number of months in the date picker
        function autoFit() {
            if (options.autoFitCalendars) {
                var maxWidth = $(window).width(),
                    initialWidth = $container.outerWidth(true),
                    $calendar = calendar.getElement(),
                    numberOfMonths = $calendar.datepicker('option', 'numberOfMonths'),
                    initialNumberOfMonths = numberOfMonths;

                if (initialWidth > maxWidth) {
                    while (numberOfMonths > 1 && $container.outerWidth(true) > maxWidth) {
                        $calendar.datepicker('option', 'numberOfMonths', --numberOfMonths);
                    }
                    if (numberOfMonths !== initialNumberOfMonths) {
                        autoFit.monthWidth = (initialWidth - $container.outerWidth(true)) / (initialNumberOfMonths - numberOfMonths);
                    }
                } else {
                    while (numberOfMonths < autoFit.numberOfMonths && (maxWidth - $container.outerWidth(true)) >= autoFit.monthWidth) {
                        $calendar.datepicker('option', 'numberOfMonths', ++numberOfMonths);
                    }
                }
                reposition();
                autoFitNeeded = false;
            }
        }

        function destroy() {
            $container.remove();
            triggerButton.getElement().remove();
            $originalElement.show();
        }

        function bindEvents() {
            triggerButton.getElement().click(toggle);
            triggerButton.getElement().keydown(keyPressTriggerOpenOrClose);
            $mask.click(close);
            $(window).resize(function() { isOpen ? autoFit() : autoFitNeeded = true; });
        }

        function formatRangeForDisplay(range) {
            var dateFormat = options.dateFormat;
            return $.datepicker.formatDate(dateFormat, range.start) + (+range.end !== +range.start ? options.rangeSplitter + $.datepicker.formatDate(dateFormat, range.end) : '');
        }

        // formats a date range as JSON
        function formatRange(range) {
            var dateFormat = options.altFormat,
                formattedRange = {};
            formattedRange.start = $.datepicker.formatDate(dateFormat, range.start);
            formattedRange.end = $.datepicker.formatDate(dateFormat, range.end);
            return JSON.stringify(formattedRange);
        }

        // parses a date range in JSON format
        function parseRange(text) {
            var dateFormat = options.altFormat,
                range = null;
            if (text) {
                try {
                    range = JSON.parse(text, function(key, value) {
                        return key ? $.datepicker.parseDate(dateFormat, value) : value;
                    });
                } catch (e) {
                }
            }
            return range;
        }

        function reset() {
            var range = parseRange($originalElement.val());
            if (range) {
                triggerButton.setLabel(formatRangeForDisplay(range));
                calendar.setRange(range);
            } else {
                calendar.reset();
            }
        }

        function setRange(value) {
            var range = value || calendar.getRange();
            if(options.GAMenu) {
                var range2 =  calendar.getRange2();
            }
            if (!range.start) {
                return;
            }
            if (!range.end) {
                range.end = range.start;
            }
            value && calendar.setRange(range);
            var label = formatRangeForDisplay(range)
            if(options.GAMenu && range2.start) {
                label = '<b>' + label + '</b>';
                if(!range2.end) {
                    range2.end = range2.start;
                }
                label +=  '<br/><span class="textCompare">' + lang.compareTo + ' : ' + formatRangeForDisplay(range2) + '</span>';
            }
            triggerButton.setLabel(label);
            var value = formatRange(range);

            if(options.GAMenu && range2.start) {
                value = JSON.stringify({'firstRange': value, 'secondRange' : formatRange(range2)});
            }

            $originalElement.val(value).change();

            if (options.onChange) {
                options.onChange();
            }
        }

        function getRange() {
            return parseRange($originalElement.val());
        }

        function clearRange() {
            triggerButton.reset();
            calendar.reset();
        }

        // callback - used when the user clicks a preset range
        function usePreset() {
            var $this = $(this),
                start = $this.data('dateStart')().startOf('day').toDate(),
                end = $this.data('dateEnd')().startOf('day').toDate();
            calendar.setRange({ start: start, end: end });
            if (options.applyOnMenuSelect) {
                close();
                setRange();
            }
            return false;
        }

        /**
         * GAMenu (first select onChange)
         */
        function GASelect1Change() {
            var $this = $(this),
                start = $(this).find(':selected').data('dateStart')!=undefined?$(this).find(':selected').data('dateStart')().startOf('day').toDate():null,
                end = $(this).find(':selected').data('dateStart')!=undefined?$(this).find(':selected').data('dateEnd')().startOf('day').toDate():null;

            calendar.setRange({ start: start, end: end });
            if(start != null) {
                $('#firstInput').val($.datepicker.formatDate(options.dateFormat, start));
                $('#secondInput').val($.datepicker.formatDate(options.dateFormat, end));
            }

            if (options.applyOnMenuSelect) {
                close();
                setRange();
            }

            return false;
        }

        /**
         * GAMenu (second select onChange)
         */
        function GASelect2Change() {
            var $this = $(this),
                start = $(this).find(':selected').data('dateStart')!=undefined?$(this).find(':selected').data('dateStart')().startOf('day').toDate():null,
                end = $(this).find(':selected').data('dateStart')!=undefined?$(this).find(':selected').data('dateEnd')().startOf('day').toDate():null;

            calendar.setRange2({ start: start, end: end });
            if(start != null) {
                $('#thirdInput').val($.datepicker.formatDate(options.dateFormat, start));
                $('#fourthInput').val($.datepicker.formatDate(options.dateFormat, end));
            }

            if (options.applyOnMenuSelect) {
                close();
                setRange();
            }

            return false;
        }

        /**
         * GAMenu (checkbox onClick)
         */
        function GACheckboxClick() {
            if($('#compareTo').prop('checked')) {
                $('#secondSelect').prop('disabled', false);
                $('.thirdBlock').css('display', 'block');
            } else {
                calendar.setRange2({start: null, end: null});
                calendar.refresh();
                $('#thirdInput').val('');
                $('#fourthInput').val('');
                $('#secondSelect').prop('disabled', true);
                $('.thirdBlock').css('display', 'none');
            }
        }

        /**
         * GAMenu (first input onClick)
         */
        function GAFirstInputClick() {
            calendar.setState(0);
            $('.GAInput').removeClass('active1 active2');
            $('#firstInput').addClass('active1');
        }

        /**
         * GAMenu (first input onChange)
         */
        function GAFirstInputChange() {
            var range = calendar.getRange();
            try {
                var date = $.datepicker.parseDate(options.dateFormat, $(this).val());
                var maxDateAttr = options.datepickerOptions.maxDate;
                var inst = $originalElement.data("datepicker");
                var maxDateObj = $.datepicker._determineDate(inst, maxDateAttr, new Date());
                if(date > maxDateObj) {
                    options.displayErrorFunction(lang.dateTooHigh);
                    $(this).val('');
                    calendar.setRange({start: null, end: range.end});
                    calendar.refresh();
                } else {
                    calendar.setRange({start: date, end: range.end});
                    calendar.setState(1);
                    calendar.refresh();
                }
            } catch(err) {
                options.displayErrorFunction(lang.invalidFormat);
                $(this).val('');
                calendar.setRange({start: null, end: range.end});
                calendar.refresh();
            }
        }

        /**
         * GAMenu (second input onClick)l
         */
        function GASecondInputClick() {
            calendar.setState(1);
            $('.GAInput').removeClass('active1 active2');
            $('#secondInput').addClass('active1');
        }

        /**
         * GAMenu (second input onChange)
         */
        function GASecondInputChange() {
            var range = calendar.getRange();
            try {
                var date = $.datepicker.parseDate(options.dateFormat, $(this).val());
                var maxDateAttr = options.datepickerOptions.maxDate;
                var inst = $originalElement.data("datepicker");
                var maxDateObj = $.datepicker._determineDate(inst, maxDateAttr, new Date());

                if(date > maxDateObj) {
                    options.displayErrorFunction(lang.dateTooHigh);
                    $(this).val('');
                    calendar.setRange({start: range.start, end: null});
                    calendar.refresh();
                } else {
                    calendar.setRange({start: range.start, end: date});
                    calendar.setState(2);
                    calendar.refresh();
                }
            } catch(err) {
                options.displayErrorFunction(lang.invalidFormat);
                $(this).val('');
                calendar.setRange({start: range.start, end: null});
                calendar.refresh();
            }
        }

        /**
         * GAMenu (third input onClick)
         */
        function GAThirdInputClick() {
            calendar.setState(2);
            $('.GAInput').removeClass('active1 active2');
            $('#thirdInput').addClass('active2');
        }

        /**
         * GAMenu (third input onChange)
         */
        function GAThirdInputChange() {
            var range2 = calendar.getRange2();
            try {
                var date = $.datepicker.parseDate(options.dateFormat, $(this).val());
                var maxDateAttr = options.datepickerOptions.maxDate;
                var inst = $originalElement.data("datepicker");
                var maxDateObj = $.datepicker._determineDate(inst, maxDateAttr, new Date());

                if(date > maxDateObj) {
                    options.displayErrorFunction(lang.dateTooHigh);
                    $(this).val('');
                    calendar.setRange2({start: null, end: range2.end});
                    calendar.refresh();
                } else {
                    calendar.setRange2({start: date, end: range2.end});
                    calendar.setState(3);
                    calendar.refresh();
                }
            } catch(err) {
                options.displayErrorFunction(lang.invalidFormat);
                $(this).val('');
                calendar.setRange2({start: null, end: range2.end});
                calendar.refresh();
            }
        }

        /**
         * GAMenu (fourth input onClick)
         */
        function GAFourthInputClick() {
            calendar.setState(3);
            $('.GAInput').removeClass('active1 active2');
            $('#fourthInput').addClass('active2');
        }

        /**
         * GAMenu (fourth input onChange)
         */
        function GAFourthInputChange() {
            var range2 = calendar.getRange2();
            try {
                var date = $.datepicker.parseDate(options.dateFormat, $(this).val());
                var maxDateAttr = options.datepickerOptions.maxDate;
                var inst = $originalElement.data("datepicker");
                var maxDateObj = $.datepicker._determineDate(inst, maxDateAttr, new Date());

                if(date > maxDateObj) {
                    options.displayErrorFunction(lang.dateTooHigh);
                    $(this).val('');
                    calendar.setRange2({start: range2.start, end: null});
                    calendar.refresh();
                } else {
                    calendar.setRange2({start: range2.start, end: date});
                    calendar.setState(0);
                    calendar.refresh();
                }
            } catch(err) {
                options.displayErrorFunction(lang.invalidFormat);
                $(this).val('');
                calendar.setRange2({start: range2.start, end: null});
                calendar.refresh();
            }
        }

        // adjusts dropdown's position taking into account the available space
        function reposition() {
            $container.position({
                my: 'left top',
                at: 'left bottom' + (options.verticalOffset < 0 ? options.verticalOffset : '+' + options.verticalOffset),
                of: triggerButton.getElement(),
                collision : 'flipfit flipfit',
                using: function(coords, feedback) {
                    var containerCenterX = feedback.element.left + feedback.element.width / 2,
                        triggerButtonCenterX = feedback.target.left + feedback.target.width / 2,
                        prevHSide = hSide,
                        last,
                        containerCenterY = feedback.element.top + feedback.element.height / 2,
                        triggerButtonCenterY = feedback.target.top + feedback.target.height / 2,
                        prevVSide = vSide,
                        vFit; // is the container fit vertically

                    hSide = (containerCenterX > triggerButtonCenterX) ? RIGHT : LEFT;
                    if (hSide !== prevHSide) {
                        if (options.mirrorOnCollision) {
                            last = (hSide === LEFT) ? presetsMenu : calendar;
                            $container.children().first().append(last.getElement());
                        }
                        $container.removeClass(classname + '-' + sides[prevHSide]);
                        $container.addClass(classname + '-' + sides[hSide]);
                    }
                    $container.css({
                        left: coords.left,
                        top: coords.top
                    });

                    vSide = (containerCenterY > triggerButtonCenterY) ? BOTTOM : TOP;
                    if (vSide !== prevVSide) {
                        if (prevVSide !== null) {
                            triggerButton.getElement().removeClass(classname + '-' + sides[prevVSide]);
                        }
                        triggerButton.getElement().addClass(classname + '-' + sides[vSide]);
                    }
                    vFit = vSide === BOTTOM && feedback.element.top - feedback.target.top !== feedback.target.height + options.verticalOffset
                        || vSide === TOP && feedback.target.top - feedback.element.top !== feedback.element.height + options.verticalOffset;
                    triggerButton.getElement().toggleClass(classname + '-vfit', vFit);
                }
            });
        }

        function killEvent(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        function keyPressTriggerOpenOrClose(event) {
            switch (event.which) {
                case $.ui.keyCode.UP:
                case $.ui.keyCode.DOWN:
                    killEvent(event);
                    open();
                    return;
                case $.ui.keyCode.ESCAPE:
                    killEvent(event);
                    close();
                    return;
                case $.ui.keyCode.TAB:
                    close();
                    return;
            }
        }

        function open() {
            if (!isOpen) {
                triggerButton.getElement().addClass(classname + '-active');
                $mask.show();
                isOpen = true;
                autoFitNeeded && autoFit();
                calendar.scrollToRangeStart();
                $container.show();
                reposition();
            }
            if (options.onOpen) {
                options.onOpen();
            }
        }

        function close() {
            if (isOpen) {
                $container.hide();
                $mask.hide();
                triggerButton.getElement().removeClass(classname + '-active');
                isOpen = false;
            }
            if (options.onClose) {
                options.onClose();
            }
        }

        function toggle() {
            isOpen ? close() : open();
        }

        function getContainer(){
            return $container;
        }

        init();
        return {
            toggle: toggle,
            destroy: destroy,
            open: open,
            close: close,
            setRange: setRange,
            getRange: getRange,
            clearRange: clearRange,
            reset: reset,
            getContainer: getContainer
        };
    }

})(jQuery, window);