import { DateTime } from 'luxon';
import { actionChevronSmallLeft, actionChevronSmallRight } from '../../../../node_modules/@jato/svgs/dist/index.esm.js';
import { sformat } from '../../../utilities/common-utilities.js';
import { OTC_ICON_BUNDLE_WC_ACTION } from '../../../utilities/render-utilities.js';
import datePickerLang from './datepicker-lang.js';
import { mergeObjects, isEqualDate } from './datePicker-utility.js';

const DEFAULT_CONFIG = {
  lang: 'en',
  format: 'yyyy-MM-dd',
  timeSelection: false,
  amPmTime: false,
  weekStartDay: 1,
  weekdayLabelList: [],
  weekdayShortLabelList: [],
  monthLabelList: [],
  monthShortLabelList: [],
  twelveHoursTimeAbbreviation: { am: 'AM', pm: 'PM' },
  isRTL: false,
  isJATOTheme: false,
};

const BODY_TYPES = ['DAYS', 'MONTHS', 'YEARS'];
const FOOTER_TYPE_HOUR = 'HOUR';
const FOOTER_TYPE_MINUTE = 'MINUTE';

const CSS_DP = 'ot-datepicker';
const CSS_DP_CELL = 'ot-datepicker__cell';
const CSS_DP_CELL_OUT_OF_RANGE = 'ot-datepicker__cell--out-of-range';
const CSS_DP_ITEM_SELECTED_DATE = 'ot-datepicker__item--selected-date';
const CSS_DP_ITEM_CURRENT_DATE = 'ot-datepicker__item--current-date';
const CSS_DP_CELL_FUTURE_MONTH = 'ot-datepicker__cell--future-month';
const CSS_DP_HEADER_NAV_CURRENT_BTN_DISABLED = 'ot-datepicker__header-navigation-current-btn--disabled';
const CSS_DP_ITEM = 'ot-datepicker__item';

class DatePicker {
  constructor(inputElement) {
    this.isVisible = false;
    this.bodyType = 'DAYS';
    this.value = null;
    this.year = 0;
    this.month = 0;
    this.day = 0;
    this.hours = 0;
    this.minutes = 0;
    this.time = 0;
    this.inputElement = inputElement;
    this.config = {};
    this.gridConfig = {};
    this.gridFocus = {};
    this.el = {
      wrapper: null, header: null, body: null, footer: null,
    };
  }

  /**
   * Initialize and setup elements.
   *
   * @param {Object} config
   * @param {DateTime} dateValue
   */
  init(config, dateValue) {
    this._initConfig(config);
    this._initValue(dateValue);
    this._setupWrapper();
    this._setupHeader();
    this._setupBody();
    this._setupFooter();
  }

  /**
   * Reinitialize without element setup.
   *
   * @param {Object} config
   * @param {DateTime} dateValue
   * @param {Boolean} shouldTriggerUpdate
   */
  reInit(config, dateValue, shouldTriggerUpdate = false) {
    this._initConfig(config);
    this._initValue(dateValue, shouldTriggerUpdate);
    this._setupHeader(true);
    this._setBodyContent();
    this._setupFooter();
  }

  /**
   * Add the date picker to a parent element.
   */
  open() {
    this.isVisible = true;
    this.inputElement.parentElement.appendChild(this.el.wrapper);
  }

  /**
   * Remove the date picker from a parent element.
   */
  close() {
    if (!this.inputElement.parentElement.querySelector(`.${CSS_DP}`)) {
      return;
    }

    this.inputElement.parentElement.removeChild(this.el.wrapper);
    this.inputElement.focus();
    this.isVisible = false;
  }

  /**
   *
   * @param config
   * @private
   */
  _initConfig(config) {
    this.config = mergeObjects(config, DEFAULT_CONFIG);
  }

  /**
   * Initialize and break down the date value.
   *
   * @param {DateTime} dateValue
   * @param {Boolean} shouldTriggerUpdate
   * @private
   */
  _initValue(dateValue, shouldTriggerUpdate = false) {
    this.value = dateValue;

    this.year = this.value.year;
    this.month = this.value.month - 1;
    this.day = this.value.day;
    this.hours = this.value.hour;
    this.minutes = this.value.minute;

    const hasInitialValue = (this.inputElement.value.length || this.inputElement.getRootNode().host.value.length);

    if (hasInitialValue) {
      this._setInputValue(shouldTriggerUpdate);
    }
  }

  /**
   * Create wrapper's structure for the date picker.
   *
   * @private
   */
  _setupWrapper() {
    const el = document.createElement('div');
    el.classList.add(CSS_DP);
    el.setAttribute('role', 'region');
    el.setAttribute('lang', this.config.lang);
    el.setAttribute('aria-label', datePickerLang.DatePickerRegionAria);
    this.el.wrapper = el;
  }

  /**
   * Create a structure for the header.
   *
   * @private
   */
  _setupHeader(isUpdate = false) {
    const row = document.createElement('div');
    row.classList.add('ot-datepicker__header');

    for (let i = 0; i < 3; i += 1) {
      const cell = document.createElement('div');
      let btn;
      if (i === 0) { // Navigation previous item
        cell.classList.add('ot-datepicker__header-navigation-prev');
        btn = document.createElement('otc-button');
        if (this.config.isJATOTheme) {
          const icon = document.createElement('otc-icon');
          icon.setAttribute('svg', `${actionChevronSmallLeft}`);
          btn.setAttribute('size', 'small');
          btn.appendChild(icon);
        } else {
          btn.setAttribute('icon', `${OTC_ICON_BUNDLE_WC_ACTION}:action_caret_left32`);
        }
      } else if (i === 1) {
        cell.classList.add('ot-datepicker__header-navigation-current');
        btn = document.createElement('button');
        btn.classList.add('ot-datepicker__header-navigation-current-btn');
      } else if (i === 2) { // Navigation next item
        cell.classList.add('ot-datepicker__header-navigation-next');
        btn = document.createElement('otc-button');
        if (this.config.isJATOTheme) {
          const icon = document.createElement('otc-icon');
          icon.setAttribute('svg', `${actionChevronSmallRight}`);
          btn.setAttribute('size', 'small');
          btn.appendChild(icon);
        } else {
          btn.setAttribute('icon', `${OTC_ICON_BUNDLE_WC_ACTION}:action_caret_right32`);
        }
      }
      btn.onclick = this._onHeaderChange.bind(this);
      btn.addEventListener('keyup', (event) => {
        if (event.key === 'Escape') {
          this.close();
        }
      });
      cell.appendChild(btn);
      row.appendChild(cell);
    }

    this.el.header = row;

    if (isUpdate) {
      this.el.wrapper.firstChild.replaceWith(this.el.header);
    } else {
      this.el.wrapper.appendChild(this.el.header);
    }

    this._setHeaderContent();
  }

  /**
   * Set content for the header's structure.
   *
   * @private
   */
  _setHeaderContent() {
    const prevTitle = datePickerLang[`${this.bodyType}PreviousButtonTitle`];
    this.el.header.children[0].firstChild.setAttribute('title', prevTitle);

    const titleNext = datePickerLang[`${this.bodyType}NextButtonTitle`];
    this.el.header.children[2].firstChild.setAttribute('title', titleNext);

    // the variable elements
    const centerElement = this.el.header.children[1].firstChild;
    let centerContent;
    let prevButtonAria;
    let nextButtonAria;
    let centerButtonTitle;
    let centerButtonAria;
    if (this.bodyType === 'DAYS') {
      const monthTxt = this.config.monthLabelList[this.month];
      centerContent = sformat(datePickerLang.DAYSCenterButtonText, monthTxt, this.year);
      centerButtonTitle = sformat(datePickerLang.DAYSCenterButtonTitle, monthTxt, this.year);
      centerButtonAria = sformat(datePickerLang.DAYSCenterButtonAria, monthTxt, this.year);
      const prevMonth = (this.month + 11) % 12;
      const prevMonthTxt = this.config.monthLabelList[prevMonth];
      const prevMonthYear = prevMonth < this.month ? this.year : this.year - 1;
      prevButtonAria = sformat(datePickerLang.DAYSPreviousButtonAria, prevMonthTxt, prevMonthYear);
      const nextMonth = (this.month + 1) % 12;
      const nextMonthTxt = this.config.monthLabelList[nextMonth];
      const nextMonthYear = nextMonth > this.month ? this.year : this.year + 1;
      nextButtonAria = sformat(datePickerLang.DAYSNextButtonAria, nextMonthTxt, nextMonthYear);
    } else if (this.bodyType === 'MONTHS') {
      centerContent = sformat(datePickerLang.MONTHSCenterButtonText, this.year);
      centerButtonTitle = sformat(datePickerLang.MONTHSCenterButtonTitle, this.year);
      centerButtonAria = sformat(datePickerLang.MONTHSCenterButtonAria, this.year);
      prevButtonAria = sformat(datePickerLang.MONTHSPreviousButtonAria, this.year - 1);
      nextButtonAria = sformat(datePickerLang.MONTHSNextButtonAria, this.year + 1);
    } else if (this.bodyType === 'YEARS') {
      const start = this.year - (this.year % 10);
      const end = start + 9;
      centerContent = sformat(datePickerLang.YEARSCenterText, start, end);
      prevButtonAria = sformat(datePickerLang.YEARSPreviousButtonAria, start - 10, end - 10);
      nextButtonAria = sformat(datePickerLang.YEARSNextButtonAria, start + 10, end + 10);
    }
    centerElement.innerText = centerContent;
    centerElement.classList.remove(CSS_DP_HEADER_NAV_CURRENT_BTN_DISABLED);
    this.el.header.children[0].firstChild.setAttribute('ariaLabel', prevButtonAria);
    this.el.header.children[2].firstChild.setAttribute('ariaLabel', nextButtonAria);

    if (this.bodyType !== 'YEARS') {
      centerElement.removeAttribute('disabled');
      centerElement.setAttribute('title', centerButtonTitle);
      centerElement.setAttribute('aria-label', centerButtonAria);
    } else {
      centerElement.setAttribute('disabled', '');
      centerElement.classList.add(CSS_DP_HEADER_NAV_CURRENT_BTN_DISABLED);
      centerElement.removeAttribute('title');
      centerElement.removeAttribute('aria-label');
    }
  }

  /**
   * Create a body structure for day, month or year view.
   *
   * @private
   */
  _setupBody() {
    if (!this.el.body) {
      const el = document.createElement('div');
      el.classList.add('ot-datepicker__body');
      this.el.body = el;
      this.el.wrapper.appendChild(el);
    }
    let toAppend = null;

    if (this.bodyType === 'DAYS') {
      toAppend = this.el.body.calDays;
      if (!toAppend) {
        toAppend = this._makeBodyGrid(7, 7, 'ot-datepicker__days', 'ot-datepicker__row--days', this._onDateSelected.bind(this));

        this.el.body.calDays = toAppend;
        this.el.body.calDays.addEventListener('keyup', this._gridKeyHandler.bind(this));
      }
    } else if (this.bodyType === 'MONTHS') {
      toAppend = this.el.body.calMonths;
      if (!toAppend) {
        toAppend = this._makeBodyGrid(4, 4, 'ot-datepicker__months', 'ot-datepicker__row--hidden', this._onMonthSelected.bind(this));

        this.el.body.calMonths = toAppend;
        this.el.body.calMonths.addEventListener('keyup', this._gridKeyHandler.bind(this));
      }
    } else if (this.bodyType === 'YEARS') {
      toAppend = this.el.body.calYears;
      if (!toAppend) {
        toAppend = this._makeBodyGrid(4, 4, 'ot-datepicker__years', 'ot-datepicker__row--hidden', this.onYearSelected.bind(this));
        this.el.body.calYears = toAppend;
        this.el.body.calYears.addEventListener('keyup', this._gridKeyHandler.bind(this));
      }
    }

    for (; this.el.body.children.length;) this.el.body.removeChild(this.el.body.children[0]);

    this.el.body.appendChild(toAppend);
    this._setBodyContent();
  }

  /**
   * Set the content of the body's structure.
   *
   * @param {boolean} focusCurrentDate
   * @private
   */
  _setBodyContent(focusCurrentDate = false) {
    const grid = this.el.body.children[0];
    this.gridConfig = {
      yMin: 1, yMax: 3, xMax: 3,
    };

    if (this.bodyType === 'DAYS') {
      this._setBodyContentForDayView(grid, focusCurrentDate);
    } else if (this.bodyType === 'MONTHS') {
      this._setBodyContentForMonthView(grid, focusCurrentDate);
    } else if (this.bodyType === 'YEARS') {
      this._setBodyContentForYearView(grid);
    }

    if (!focusCurrentDate) {
      // prepare upper left button in the grid as tabstop
      grid.children[this.gridConfig.yMin].children[0].firstChild.setAttribute('tabindex', 0);
      this.gridFocus = { y: this.gridConfig.yMin, x: 0 };
    }
  }

  /**
   * Set content for the body in day view.
   *
   * @param grid
   * @param {boolean} focusCurrentDate
   * @private
   */
  _setBodyContentForDayView(grid, focusCurrentDate) {
    const monthStr = this.config.monthLabelList[this.month];
    const hasInitialValue = !!this.inputElement.value.length;

    grid.setAttribute('aria-label', sformat(datePickerLang.DAYSGridAria, monthStr, this.year));
    const oneDayMilliSecs = 24 * 60 * 60 * 1000;
    const start = new Date(this.year, this.month, 1, 12);
    const weekStartAdjustedDay = (start.getDay() + 7 - this.config.weekStartDay) % 7;
    let adjusted = new Date(start.getTime() - oneDayMilliSecs * weekStartAdjustedDay);

    grid.children[6].style.display = '';
    this.gridConfig = {
      yMin: 1, yMax: 6, xMax: 6,
    };

    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const cell = grid.children[y].children[x];

        // Put the weekdays in the table header cells (no buttons there), plus title and aria-label
        if (y === 0) {
          const dayIndex = (x + this.config.weekStartDay) % 7;
          cell.innerText = this.config.weekdayShortLabelList[dayIndex];
          cell.setAttribute('title', this.config.weekdayLabelList[dayIndex]);
          cell.setAttribute('aria-label', this.config.weekdayLabelList[dayIndex]);
        } else {
          const item = cell.firstChild;
          const month = adjusted.getMonth();
          const date = adjusted.getDate();

          item.classList.remove(CSS_DP_ITEM_SELECTED_DATE, CSS_DP_ITEM_CURRENT_DATE);

          cell.firstChild.innerText = date;
          cell.firstChild.setAttribute('aria-label', sformat(datePickerLang.DAYSGridCellAria, date, this.config.monthLabelList[month]));
          cell.firstChild.setAttribute('tabindex', -1);
          cell.classList.remove(CSS_DP_CELL_OUT_OF_RANGE);
          if (month !== this.month) {
            if (y === 6 && x === 0) {
              grid.children[6].style.display = 'none';
              this.gridConfig.yMax = 5;
              break;
            }
            cell.classList.add(CSS_DP_CELL_OUT_OF_RANGE);
          } else if (isEqualDate(adjusted, this.value.toJSDate()) && hasInitialValue) {
            item.classList.add(CSS_DP_ITEM_SELECTED_DATE);
            cell.setAttribute('aria-current', 'date');
            if (focusCurrentDate) {
              cell.firstChild.focus();
              cell.firstChild.setAttribute('tabindex', 0);
              this.gridFocus = { y, x };
            }
          } else if (isEqualDate(adjusted, new Date())) {
            item.classList.add(CSS_DP_ITEM_CURRENT_DATE);
          }
          adjusted = new Date(adjusted.getTime() + oneDayMilliSecs);
        }
      }
    }
  }

  /**
   * Set content for the body in month view.
   * We render this as a table, so we can have 2D keyboard navigation.
   * The column headers will be invisible.
   *
   * @param grid
   * @private
   */
  _setBodyContentForMonthView(grid) {
    const hasInitialValue = !!this.inputElement.value.length;

    grid.setAttribute('aria-label', sformat(datePickerLang.MONTHSGridAria, this.year));

    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const cell = grid.children[y].children[x];
        cell.classList.remove(CSS_DP_CELL_FUTURE_MONTH);

        if (y === 0) {
          cell.setAttribute('aria-label', sformat(datePickerLang.COLUMNAria, x + 1));
        } else {
          const item = cell.firstChild;
          const monthIndex = (y - 1) * 4 + x;
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          const displayYear = this.value.year;

          if (this.year === displayYear && (monthIndex === this.month) && hasInitialValue) {
            item.classList.add(CSS_DP_ITEM_SELECTED_DATE);
          } else {
            item.classList.remove(CSS_DP_ITEM_SELECTED_DATE);
          }

          if (this.year === currentYear && (monthIndex === currentMonth)) {
            item.classList.add(CSS_DP_ITEM_CURRENT_DATE);
          } else {
            item.classList.remove(CSS_DP_ITEM_CURRENT_DATE);
          }

          if (this.year > currentYear || (this.year === currentYear && (monthIndex > currentMonth))) {
            cell.classList.add(CSS_DP_CELL_FUTURE_MONTH);
          }
          cell.firstChild.innerText = this.config.monthShortLabelList[monthIndex];
          cell.firstChild.setAttribute('title', this.config.monthLabelList[monthIndex]);
          cell.firstChild.setAttribute('tabindex', -1);
          cell.firstChild.setAttribute('aria-label', sformat(datePickerLang.MONTHSGridCellAria, this.config.monthLabelList[monthIndex], this.year));
        }
      }
    }
  }

  /**
   * Set content for the body in year view.
   * We render this as a table, so we can have 2D keyboard navigation.
   * The column headers will be invisible.
   *
   * @param grid
   * @private
   */
  _setBodyContentForYearView(grid) {
    const hasInitialValue = !!this.inputElement.value.length;
    const decadeStart = this.year - (this.year % 10);
    const decadeEnd = this.year + 9 - (this.year % 10);

    grid.setAttribute('aria-label', sformat(datePickerLang.YEARSGridAria, decadeStart, decadeEnd));

    let year = this.year - (this.year % 10);
    for (let y = 0; y < 4; y += 1) {
      for (let x = 0; x < 4; x += 1) {
        const cell = grid.children[y].children[x];

        if (y === 0) {
          cell.setAttribute('aria-label', sformat(datePickerLang.COLUMNAria, x + 1));
        } else {
          const item = cell.firstChild;
          const currentYear = new Date().getFullYear();

          if (year === this.value.year && hasInitialValue) {
            item.classList.add(CSS_DP_ITEM_SELECTED_DATE);
          } else {
            item.classList.remove(CSS_DP_ITEM_SELECTED_DATE);
          }

          if (year === currentYear) {
            item.classList.add(CSS_DP_ITEM_CURRENT_DATE);
          } else {
            item.classList.remove(CSS_DP_ITEM_CURRENT_DATE);
          }

          cell.firstChild.innerText = year;
          cell.firstChild.setAttribute('tabindex', -1);
          cell.firstChild.setAttribute('aria-label', sformat(datePickerLang.YEARSGridCellAria, year));
          year += 1;
        }
      }
    }
    grid.children[3].children[2].classList.add(CSS_DP_CELL_OUT_OF_RANGE);
    grid.children[3].children[3].classList.add(CSS_DP_CELL_OUT_OF_RANGE);
  }

  /**
   * Creating a visual grid which gets table roles. Puts a button in every cell
   *
   * @param rows
   * @param cols
   * @param gridClass
   * @param firstRowClass
   * @param clickHandler
   * @returns {HTMLDivElement}
   * @private
   */
  _makeBodyGrid(rows, cols, gridClass, firstRowClass, clickHandler) {
    const grid = document.createElement('div');
    grid.setAttribute('role', 'table');

    grid.classList.add(gridClass);
    for (let y = 1; y < rows + 1; y += 1) {
      const row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.classList.add('ot-datepicker__row');
      if (y === 1) {
        row.classList.add(firstRowClass);
      }
      for (let x = 1; x < cols + 1; x += 1) {
        const cell = document.createElement('div');
        const cellRole = (y === 1 ? 'columnheader' : 'cell');
        cell.setAttribute('role', cellRole);
        cell.classList.add(CSS_DP_CELL);
        if (y > 1) {
          // column headers are inactive, but each body cell has a real button
          const btn = document.createElement('button');
          btn.classList.add(CSS_DP_ITEM);
          btn.onclick = clickHandler;
          cell.appendChild(btn);
        }
        row.appendChild(cell);
      }
      grid.appendChild(row);
    }
    return grid;
  }

  /**
   * Create a footer structure for showing time.
   *
   * @private
   */
  _setupFooter() {
    if (!this.el.footer) { // Create new footer.
      const footer = document.createElement('div');
      footer.classList.add('ot-datepicker__footer');
      footer.setAttribute('aria-label', datePickerLang.TimeSelectionAria);

      footer.appendChild(this._makeFooterRow(FOOTER_TYPE_HOUR));
      footer.appendChild(this._makeFooterSeparator());
      footer.appendChild(this._makeFooterRow(FOOTER_TYPE_MINUTE));
      footer.appendChild(this._makeFooterAmPmSwitch());

      this.el.footer = footer;
      this.el.wrapper.appendChild(footer);
    }

    if (!this.config.timeSelection) {
      this.el.footer.classList.add('ot-datepicker__footer--hidden');
    } else {
      this.el.footer.classList.remove('ot-datepicker__footer--hidden');
    }

    if (!this.config.amPmTime) {
      this.el.footer.classList.add('ot-datepicker__footer--am-pm-switch-hidden');
    } else {
      this.el.footer.classList.remove('ot-datepicker__footer--am-pm-switch-hidden');
    }

    this._setFooterContent();
  }

  /**
   * Set content to the footer's structure.
   *
   * @private
   */
  _setFooterContent() {
    if (this.el.footer) {
      this.el.footer.querySelector('#time-input-hour').value = (this.config.amPmTime) ? this.value.toFormat('h') : this.hours;
      this.el.footer.querySelector('#time-input-minute').value = this.minutes;

      const inputAm = this.el.footer.querySelector('#radio-am');
      const inputPm = this.el.footer.querySelector('#radio-pm');

      if (this.hours >= 12) {
        inputPm.checked = true;
        inputAm.checked = false;
      } else {
        inputAm.checked = true;
        inputPm.checked = false;
      }
    }
  }

  _setFooterVisibility(visibility) {
    if (!this.config.timeSelection) {
      this.el.footer.classList.add('ot-datepicker__footer--hidden');
    } else if (visibility) {
      this.el.footer.classList.remove('ot-datepicker__footer--hidden');
    } else {
      this.el.footer.classList.add('ot-datepicker__footer--hidden');
    }
  }

  _makeFooterSeparator() {
    const row = document.createElement('div');
    row.classList.add('ot-datepicker__time-item');
    row.classList.add('ot-datepicker__time-item--time-separator');
    row.innerText = ':';

    return row;
  }

  _makeFooterAmPmSwitch() {
    const row = document.createElement('div');
    row.classList.add('ot-datepicker__time-item');
    row.classList.add('ot-datepicker__time-item--am-pm-switch');
    row.id = 'am-pm-switch-element';

    const toggleWrapper = row.appendChild(document.createElement('fieldset'));
    const legend = document.createElement('legend');
    legend.innerText = datePickerLang.TimePeriod;
    toggleWrapper.classList.add('ot-datepicker__time-am-pm');

    const inputAm = document.createElement('input');
    const inputPm = document.createElement('input');
    const inputLabelAm = document.createElement('label');
    const inputLabelPm = document.createElement('label');

    inputAm.type = 'radio';
    inputAm.id = 'radio-am';
    inputAm.name = 'am-pm-switch';

    inputPm.type = 'radio';
    inputPm.id = 'radio-pm';
    inputPm.name = 'am-pm-switch';

    inputLabelAm.setAttribute('for', 'radio-am');
    inputLabelAm.innerText = this.config.twelveHoursTimeAbbreviation.am;
    inputLabelPm.setAttribute('for', 'radio-pm');
    inputLabelPm.innerText = this.config.twelveHoursTimeAbbreviation.pm;

    inputAm.oninput = this._onTimeInput.bind(this);
    inputPm.oninput = this._onTimeInput.bind(this);

    inputAm.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    inputPm.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    toggleWrapper.appendChild(legend);
    toggleWrapper.appendChild(inputAm);
    toggleWrapper.appendChild(inputLabelAm);
    toggleWrapper.appendChild(inputPm);
    toggleWrapper.appendChild(inputLabelPm);
    toggleWrapper.appendChild(document.createElement('span'));

    return row;
  }

  /**
   * Create a row with input time slider.
   *
   * @param {string} type
   * @private
   */
  _makeFooterRow(type) {
    const row = document.createElement('div');
    row.classList.add('ot-datepicker__time-item');

    const inputWrapper = row.appendChild(document.createElement('div'));
    inputWrapper.classList.add('ot-datepicker__time-input');
    inputWrapper.classList.add('ot-form-control');

    const input = inputWrapper.appendChild(document.createElement('input'));
    input.type = 'text';
    input.classList.add('ot-input');
    input.id = type === FOOTER_TYPE_HOUR ? 'time-input-hour' : 'time-input-minute';
    input.oninput = this._onTimeInput.bind(this);
    input.setAttribute('maxlength', '2');
    input.setAttribute('aria-label', type === FOOTER_TYPE_HOUR ? datePickerLang.TimeHoursAria : datePickerLang.TimeMinutesAria);
    input.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.close();
      }
    });

    return row;
  }

  /**
   * Set the current selected value to the input element.
   * When shouldUpdate param is set to true, the iso-value will be set to the input field and the value-updated event will be triggered.
   * This event will be caught in an input date component and will adapt the proper attributes.
   *
   * @param {Boolean} shouldTriggerUpdate
   * @private
   */
  _setInputValue(shouldTriggerUpdate = false) {
    const value = DateTime.local(this.year, this.month + 1, this.day, this.hours, this.minutes);

    if (!value.isValid) {
      return;
    }

    this.value = value;

    this.inputElement.value = this.value.toFormat(this.config.format, { locale: this.config.lang });

    if (shouldTriggerUpdate) {
      const isoValue = this.value.toISO();
      this.inputElement.setAttribute('iso-value', this.config.timeSelection ? isoValue : isoValue.split('T')[0]);
      this.inputElement.dispatchEvent(new Event('value-updated'));
    }
  }

  /**
   * Handling when a date is selected.
   *
   * @param {Event} e
   * @private
   */
  _onDateSelected(e) {
    const row = e.target.parentNode.parentNode;
    const date = parseInt(e.target.innerText, 10);
    if (!(row.nextSibling && row.nextSibling.nextSibling) && date < 8) {
      this.month += 1;
    } else if (!(row.previousSibling && row.previousSibling.previousSibling) && date > 7) {
      this.month -= 1;
    }

    if (this.month > 11 || this.month < 0) {
      this.year += Math.floor(this.month / 11);
      this.month = this.month > 11 ? 0 : 11;
    }

    this.day = parseInt(e.target.innerText, 10);
    this._setInputValue(true);
    this._setHeaderContent();
    this._setBodyContent(true);

    if (!this.config.timeSelection) {
      this.close();
    }
  }

  /**
   * Handling when a month is selected.
   *
   * @param {Event} e
   * @private
   */
  _onMonthSelected(e) {
    let col = 0;
    let row = 3;
    const cell = e.target.parentNode;
    if (cell.parentNode.nextSibling) {
      row = cell.parentNode.previousSibling.previousSibling ? 2 : 1;
    }
    if (cell.previousSibling) {
      col = 3;
      if (cell.nextSibling) {
        col = cell.previousSibling.previousSibling ? 2 : 1;
      }
    }
    this.month = 4 * (row - 1) + col;
    this.bodyType = 'DAYS';
    this._setHeaderContent();
    this._setupBody();
    this._setBodyContent();
    this._setFooterVisibility(true);
  }

  /**
   * Handling when a year is selected.
   *
   * @param {Event} e
   * @private
   */
  onYearSelected(e) {
    this.year = parseInt(e.target.innerText, 10);
    this.bodyType = 'MONTHS';
    this._setHeaderContent();
    this._setupBody();
  }

  /**
   * Handling for navigating in header.
   *
   * @param {Event} e
   * @private
   */
  _onHeaderChange(e) {
    const cell = e.currentTarget.parentElement;
    let headerButtonSign = 0;
    if (cell.classList.contains('ot-datepicker__header-navigation-current')) {
      const idx = BODY_TYPES.indexOf(this.bodyType);
      if (idx < 0 || !BODY_TYPES[idx + 1]) {
        return;
      }
      this.bodyType = BODY_TYPES[idx + 1];
      this._setupBody();
      this._setFooterVisibility(false);
    } else {
      headerButtonSign = cell.classList.contains('ot-datepicker__header-navigation-next') ? 1 : -1;
      switch (this.bodyType) {
        case 'MONTHS':
          this.year += headerButtonSign * 1;
          break;
        case 'YEARS':
          this.year += headerButtonSign * 10;
          break;
        case 'DAYS':
        default:
          this.month += headerButtonSign * 1;
          break;
      }
      if (this.month > 11 || this.month < 0) {
        this.year += Math.floor(this.month / 11);
        this.month = this.month > 11 ? 0 : 11;
      }
    }
    this._setHeaderContent();
    this._setBodyContent(false);
  }

  /**
   * Handling when the time is changed.
   *
   * @param {Event} event
   * @private
   */
  _onTimeInput(event) {
    if (event.target.id === 'time-input-hour') {
      event.target.value = event.target.value.replace(/\D+/g, '');
      const valueAsNumber = Number(event.target.value);

      if (this.config.amPmTime && valueAsNumber > 12) {
        event.target.value = '12';
      } else if (this.config.amPmTime && this.el.footer.querySelector('#radio-am').checked && valueAsNumber === 12) {
        event.target.value = '0';
      } else if (!this.config.amPmTime && valueAsNumber > 23) {
        event.target.value = '0';
      }

      const targetValue = Number(event.target.value);
      const shouldBeAdjustedTo24HourFormat = this.config.amPmTime
        && this.el.footer.querySelector('#radio-pm').checked && targetValue < 12;

      this.hours = shouldBeAdjustedTo24HourFormat ? targetValue + 12 : targetValue;
    } else if (event.target.id === 'time-input-minute') {
      event.target.value = event.target.value.replace(/\D+/g, '');

      if (Number(event.target.value) > 59) {
        event.target.value = '0';
      }

      this.minutes = Number(event.target.value);
    } else if (event.target.id === 'radio-am') {
      this.hours -= 12;
    } else if (event.target.id === 'radio-pm') {
      if (this.hours === 12) {
        this.hours = 23;
      } else {
        this.hours += 12;
      }
    }

    this._setInputValue(true);
  }

  /**
   * Handling for using keyboard to navigate in the body's grid.
   *
   * @param {Event} event
   * @private
   */
  _gridKeyHandler(event) {
    let yNext = this.gridFocus.y;
    let yMove = 0;
    let xNext = this.gridFocus.x;
    let xMove = 0;
    switch (event.key) {
      case 'ArrowRight':
        xMove = !this.config.isRTL ? 1 : -1;
        break;
      case 'ArrowLeft':
        xMove = !this.config.isRTL ? -1 : 1;
        break;
      case 'ArrowUp':
        if (this.gridFocus.y > this.gridConfig.yMin) {
          yMove = -1;
        }
        break;
      case 'ArrowDown':
        if (this.gridFocus.y < this.gridConfig.yMax) {
          yMove = 1;
        }
        break;
      case 'Home':
        yNext = this.gridConfig.yMin;
        xNext = 0;
        break;
      case 'End':
        yNext = this.gridConfig.yMax;
        xNext = this.gridConfig.xMax;
        break;
      case 'Escape':
        this.close(); // TODO focus should go to the opening button
        break;
    }

    xNext += xMove;
    if (xNext < 0) {
      xNext = this.gridConfig.xMax;
      yMove = -1;
    } else if (xNext > this.gridConfig.xMax) {
      xNext = 0;
      yMove = 1;
    }
    yNext += yMove;
    if (yNext < this.gridConfig.yMin) {
      yNext = this.gridConfig.yMin;
      xNext = 0;
    } else if (yNext > this.gridConfig.yMax) {
      yNext = this.gridConfig.yMax;
      xNext = this.gridConfig.xMax;
    }
    if (this.gridFocus.y !== yNext || this.gridFocus.x !== xNext) {
      const grid = this.el.body.children[0];
      grid.children[this.gridFocus.y].children[this.gridFocus.x].firstChild.setAttribute('tabindex', -1);
      const nextCellButton = grid.children[yNext].children[xNext].firstChild;
      nextCellButton.setAttribute('tabindex', '0');
      nextCellButton.focus();
      this.gridFocus.y = yNext;
      this.gridFocus.x = xNext;
    }
  }
}

export { DatePicker };
//# sourceMappingURL=datePicker.js.map
