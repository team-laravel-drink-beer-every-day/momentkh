/**
 * be : Buddhist Era
 * ad : Anno Domini
 *
 * The following calculation is from "Pratitin Soryakkatik-Chankatik 1900-1999" by Mr. Roath Kim Soeun.
 * It illustrates how to determine if a given year is a normal year, leap-day year, or leap-month year.
 * The calculation can use different eras including Buddhist Era, Jola Sakaraj but not AD.
 * Here we choose to use only Buddhist Era.
 *
 * @credit http://www.cam-cc.org
 */

// const Moment = require('moment');
function getLocaleConfig() {
  return require('./locale/km');
}

let config = getLocaleConfig();

let {LunarMonths, SolarMonth, MoonStatus} = require('./constant');

;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory :
    typeof define === 'function' && define.amd ? define(factory) :
      global.momentkh = factory
}(this, (function (Moment) {
  'use strict';

  /**
   * Bodithey: បូតិថី
   * Bodithey determines if a given beYear is a leap-month year. Given year target year in Buddhist Era
   * @return Number (0-29)
   */
  function getBodithey(beYear) {
    let ahk = getAharkun(beYear);
    let avml = Math.floor((11 * ahk + 25) / 692);
    let m = avml + ahk + 29;
    return (m % 30);
  }

  /**
   * Avoman: អាវមាន
   * Avoman determines if a given year is a leap-day year. Given a year in Buddhist Era as denoted as adYear
   * @param beYear (0 - 691)
   */
  function getAvoman(beYear) {
    let ahk = getAharkun(beYear);
    let avm = (11 * ahk + 25) % 692;
    return avm;
  }

  /**
   * Aharkun: អាហារគុណ ឬ ហារគុណ
   * Aharkun is used for Avoman and Bodithey calculation below. Given adYear as a target year in Buddhist Era
   * @param beYear
   * @returns {number}
   */
  function getAharkun(beYear) {
    let t = beYear * 292207 + 499;
    let ahk = Math.floor(t / 800) + 4;
    return ahk;
  }

  /**
   * Kromathupul
   * @param beYear
   * @returns {number} (1-800)
   */
  function kromthupul(beYear) {
    let ah = getAharkunMod(beYear);
    let krom = 800 - ah;
    return krom;
  }

  /**
   * isKhmerSolarLeap
   * @param beYear
   * @returns {number}
   */
  function isKhmerSolarLeap(beYear) {
    let krom = kromthupul(beYear);
    if (krom <= 207)
      return 1;
    else
      return 0;
  }

  /**
   * getAkhakunMod
   * @param beYear
   * @returns {number}
   */
  function getAharkunMod(beYear) {
    let t = beYear * 292207 + 499;
    let ahkmod = t % 800;
    return ahkmod;
  }

  /**
   * * Regular if year has 30 day
   * * leap month if year has 13 months
   * * leap day if Jesth month of the year has 1 extra day
   * * leap day and month: both of them
   * @param beYear
   * @returns {number} return 0:regular, 1:leap month, 2:leap day, 3:leap day and month
   */
  function getBoditheyLeap(beYear) {
    let result = 0;
    let avoman = getAvoman(beYear);
    let bodithey = getBodithey(beYear);

    // check bodithey leap month
    let boditheyLeap = 0;
    if (bodithey >= 25 || bodithey <= 5) {
      boditheyLeap = 1;
    }
    // check for avoman leap-day based on gregorian leap
    let avomanLeap = 0;
    if (isKhmerSolarLeap(beYear)) {
      if (avoman <= 126)
        avomanLeap = 1;
    } else {
      if (avoman <= 137) {
        // check for avoman case 137/0, 137 must be normal year (p.26)
        if (getAvoman(beYear + 1) === 0) {
          avomanLeap = 0;
        } else {
          avomanLeap = 1;
        }
      }
    }

    // case of 25/5 consecutively
    // only bodithey 5 can be leap-month, so set bodithey 25 to none
    if (bodithey === 25) {
      let nextBodithey = getBodithey(beYear + 1);
      if (nextBodithey === 5) {
        boditheyLeap = 0;
      }
    }

    // case of 24/6 consecutively, 24 must be leap-month
    if (bodithey == 24) {
      let nextBodithey = getBodithey(beYear + 1);
      if (nextBodithey == 6) {
        boditheyLeap = 1;
      }
    }

    // format leap result (0:regular, 1:month, 2:day, 3:both)
    if (boditheyLeap === 1 && avomanLeap === 1) {
      result = 3;
    } else if (boditheyLeap === 1) {
      result = 1;
    } else if (avomanLeap === 1) {
      result = 2;
    } else {
      result = 0;
    }

    return result;
  }

  // return 0:regular, 1:leap month, 2:leap day (no leap month and day together)
  /**
   * bodithey leap can be both leap-day and leap-month but following the khmer calendar rule, they can't be together on the same year, so leap day must be delayed to next year
   * @param beYear
   * @returns {number}
   */
  function getProtetinLeap(beYear) {
    let b = getBoditheyLeap(beYear);
    if (b === 3) {
      return 1;
    }
    if (b === 2 || b === 1) {
      return b;
    }
    // case of previous year is 3
    if (getBoditheyLeap(beYear - 1) === 3) {
      return 2;
    }
    // normal case
    return 0;
  }

  /**
   * Maximum number of day in Khmer Month
   * @param beMonth
   * @param beYear
   * @returns {number}
   */
  function getNumberOfDayInKhmerMonth(beMonth, beYear) {
    if (beMonth === LunarMonths.ជេស្ឋ && isKhmerLeapDay(beYear)) {
      return 30;
    }
    if (beMonth === LunarMonths.បឋមាសាឍ || beMonth === LunarMonths.ទុតិយាសាឍ) {
      return 30;
    }
    // មិគសិរ : 29 , បុស្ស : 30 , មាឃ : 29 .. 30 .. 29 ..30 .....
    return beMonth % 2 === 0 ? 29 : 30;
  }

  /**
   * Get number of day in Khmer year
   * @param beYear
   * @returns {number}
   */
  function getNumerOfDayInKhmerYear(beYear) {
    if (isKhmerLeapMonth(beYear)) {
      return 384;
    } else if (isKhmerLeapDay(beYear)) {
      return 355;
    } else {
      return 354;
    }
  }

  /**
   * Get number of day in Gregorian year
   * @param adYear
   * @returns {number}
   */
  function getNumberOfDayInGregorianYear(adYear) {
    if (isGregorianLeap(adYear)) {
      return 366;
    } else {
      return 365;
    }
  }

  /**
   * A year with an extra month is called Adhikameas (អធិកមាស). This year has 384 days.
   * @param beYear
   * @returns {boolean}
   */
  function isKhmerLeapMonth(beYear) {
    return getProtetinLeap(beYear) === 1
  }

  /**
   * A year with an extra day is called Chhantrea Thimeas (ចន្ទ្រាធិមាស) or Adhikavereak (អធិកវារៈ). This year has 355 days.
   * @param beYear
   * @returns {boolean}
   */
  function isKhmerLeapDay(beYear) {
    return getProtetinLeap(beYear) === 2
  }

  /**
   * Gregorian Leap
   * @param adYear
   * @returns {boolean}
   */
  function isGregorianLeap(adYear) {
    if (adYear % 4 === 0 && adYear % 100 !== 0 || adYear % 400 === 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Buddhist Era
   * @param moment
   * @returns {*}
   */
  function getBEYear(moment) {
    if (parseInt(moment.format('M')) < SolarMonth.មេសា + 1) {
      return parseInt(moment.format('YYYY')) + 543;
    } else {
      return parseInt(moment.format('YYYY')) + 544;
    }
  }

  /**
   * Moha Sakaraj
   * @param adYear
   * @returns {number}
   */
  function getMohaSakarajYear(adYear) {
    return adYear - 77;
  }

  /**
   * Jolak Sakaraj
   * @param beYear
   * @returns {number}
   */
  function getJolakSakarajYear(beYear) {
    return beYear - 1182;
  }

  /**
   * ១កើត ៤កើត ២រោច ១៤រោច ...
   * @param day 1-30
   * @returns {{count: number, moonStatus: number}}
   */
  function getKhmerLunarDay(day) {
    return {
      count: (day % 15) + 1,
      moonStatus: day > 14 ? MoonStatus.រោច : MoonStatus.កើត
    }
  }

  /**
   * Turn be year to animal year
   * @param beYear
   * @returns {number}
   */
  function getAnimalYear(beYear) {
    return (beYear + 4) % 12
  }

  /**
   * Khmer date format handler
   * @param day
   * @param month
   * @param moment
   * @param format
   * @returns {*}
   */
  function formatKhmerDate({day, month, moment}, format) {
    if (format === null || format === undefined) {
      // Default date format
      let dayOfWeek = moment.day();
      let moonDay = getKhmerLunarDay(day);
      let beYear = getBEYear(moment);
      let animalYear = getAnimalYear(beYear);
      let eraYear = getJolakSakarajYear(beYear) % 10;
      return config.postformat(`ថ្ងៃ${config.weekdays[dayOfWeek]} ${moonDay.count}${config.moonStatus[moonDay.moonStatus]} ខែ${config.lunarMonths[month]} ឆ្នាំ${config.animalYear[animalYear]} ${config.eraYear[eraYear]} ពុទ្ធសករាជ ${beYear}`);
    } else if (typeof format === 'string') {
      // Follow the format
      let formatRule = {
        'W': function () { // Day of week
          let dayOfWeek = moment.day();
          return config.weekdays[dayOfWeek]
        },
        'w': function () { // Day of week
          let dayOfWeek = moment.day();
          return config.weekdaysShort[dayOfWeek]
        },
        'd': function () { // no determine digit
          let moonDay = getKhmerLunarDay(day);
          return moonDay.count;
        },
        'D': function () { // minimum 2 digits
          let moonDay = getKhmerLunarDay(day);
          return ('' + moonDay.count).length === 1 ? '0' + moonDay.count : moonDay.count;
        },
        'n': function () {
          let moonDay = getKhmerLunarDay(day);
          return config.moonStatusShort[moonDay.moonStatus]
        },
        'N': function () {
          let moonDay = getKhmerLunarDay(day);
          return config.moonStatus[moonDay.moonStatus]
        },
        'o': function () {
          return config.moonDays[day];
        },
        'm': function () {
          return config.lunarMonths[month];
        },
        'a': function () {
          let beYear = getBEYear(moment);
          let animalYear = getAnimalYear(beYear);
          return config.animalYear[animalYear];
        },
        'e': function () {
          let beYear = getBEYear(moment);
          let eraYear = getJolakSakarajYear(beYear) % 10;
          return config.eraYear[eraYear];
        },
        'b': function () {
          return getBEYear(moment);
        },
        'c': function () {
          return moment.format('YYYY');
        },
        'j': function () {
          let beYear = getBEYear(moment);
          return getJolakSakarajYear(beYear);
        }
      }

      return config.postformat(format.replace(new RegExp(Object.keys(formatRule).join('|'), 'g'), function (matched) {
        return formatRule[matched]();
      }));

    }
    Error(format + ' is not a valid date format.');
  }

  /**
   * Read Khmer lunar date
   * @param params : String (2) (input and format)
   * @or @param Object {ថ្ងៃ: ..., កើត: ..., ខែ: ..., ពស: ...}
   * @return Moment
   */
  function readLunarDate(...params) {
    console.log('Now working yet')
  }

  /**
   * Calculate date from momoentjs to Khmer date
   * @param target : Moment
   * @returns {{day: number, month: *, epochMoved: (*|moment.Moment)}}
   */
  function findLunarDate(target) {
    /**
     * Epoch Date: January 1, 1900
     */
    let epochMoment = Moment('1/1/1900', 'D/M/YYYY')
    let khmerMonth = LunarMonths.បុស្ស;
    let khmerDay = 0; // 0 - 29 ១កើត ... ១៥កើត ១រោច ...១៤រោច (១៥រោច)

    let differentFromEpoch = target.diff(epochMoment)

    // Find nearest year epoch
    if (differentFromEpoch > 0) {
      while (Moment.duration(target.diff(epochMoment), 'milliseconds').asDays() > getNumerOfDayInKhmerYear(getBEYear(epochMoment.clone().add(1, 'year')))) {
        epochMoment.add(getNumerOfDayInKhmerYear(getBEYear(epochMoment.clone().add(1, 'year'))), 'day')
      }
    } else {
      do {
        epochMoment.subtract(getNumerOfDayInKhmerYear(getBEYear(epochMoment)), 'day')
      } while (Moment.duration(epochMoment.diff(target), 'milliseconds').asDays() > 0)
    }

    // Move epoch month
    while (Moment.duration(target.diff(epochMoment), 'milliseconds').asDays() > getNumberOfDayInKhmerMonth(khmerMonth, getBEYear(epochMoment))) {
      epochMoment.add(getNumberOfDayInKhmerMonth(khmerMonth, getBEYear(epochMoment)), 'day');
      switch (khmerMonth) {
        case LunarMonths.មិគសិរ:
          khmerMonth = LunarMonths.បុស្ស;
          break;
        case LunarMonths.បុស្ស:
          khmerMonth = LunarMonths.មាឃ;
          break;
        case LunarMonths.មាឃ:
          khmerMonth = LunarMonths.ផល្គុន;
          break;
        case LunarMonths.ផល្គុន:
          khmerMonth = LunarMonths.ចេត្រ;
          break;
        case LunarMonths.ចេត្រ:
          khmerMonth = LunarMonths.ពិសាខ;
          break;
        case LunarMonths.ពិសាខ:
          khmerMonth = LunarMonths.ជេស្ឋ;
          break;
        case LunarMonths.ជេស្ឋ: {
          if (isKhmerLeapMonth(getBEYear(epochMoment))) {
            khmerMonth = LunarMonths.បឋមាសាឍ
          } else {
            khmerMonth = LunarMonths.អាសាឍ
          }
          break;
        }
        case LunarMonths.អាសាឍ:
          khmerMonth = LunarMonths.ស្រាពណ៍;
          break;
        case LunarMonths.ស្រាពណ៍:
          khmerMonth = LunarMonths.ភទ្របទ;
          break;
        case LunarMonths.ភទ្របទ:
          khmerMonth = LunarMonths.អស្សុជ;
          break;
        case LunarMonths.អស្សុជ:
          khmerMonth = LunarMonths.កក្ដិក;
          break;
        case LunarMonths.កក្ដិក:
          khmerMonth = LunarMonths.មិគសិរ;
          break;
        case LunarMonths.បឋមាសាឍ:
          khmerMonth = LunarMonths.ទុតិយាសាឍ;
          break;
        case LunarMonths.ទុតិយាសាឍ:
          khmerMonth = LunarMonths.ស្រាពណ៍;
          break;
        default:
          throw Error('Plugin is facing wrong calculation (Invalid month)');
      }
    }

    khmerDay += Math.floor(Moment.duration(target.diff(epochMoment), 'milliseconds').asDays());

    epochMoment.add(Moment.duration(target.diff(epochMoment), 'milliseconds').asDays(), 'day');

    return {
      day: khmerDay,
      month: khmerMonth,
      epochMoved: epochMoment
    }
  }

  /**
   * Return khmer lunar date
   * @param format String (wanted format)
   * @return String
   * @or @param Array (wanted field) [ថ្ងៃ ថ្ងៃទី កើត/រោច ខែចន្ទគតិ ខែសុរិយគតិ ឆ្នាំសត្វ ឆ្នាំស័ក ពស គស ចស មស សីល]
   * @return Object
   */
  function toLunarDate(format) {

    let target = this.clone();

    let result = findLunarDate(target);

    return formatKhmerDate({
      day: result.day,
      month: result.month,
      moment: target
    }, format)
  }

  function khDay() {
    let result = findLunarDate(this.clone());
    return result.day;
  }

  function khMonth() {
    let result = findLunarDate(this.clone());
    return result.month;
  }

  function khYear() {
    return getBEYear(this.clone());
  }

  Moment.readLunarDate =
    Moment.khDate =
      Moment.khdate =
        readLunarDate;

  Moment.fn.toLunarDate =
    Moment.fn.toKhDate =
      Moment.fn.tokhdate =
        toLunarDate;

  Moment.fn.khDay = khDay;
  Moment.fn.khMonth = khMonth;
  Moment.fn.khYear = khYear;

  return Moment;
})));
