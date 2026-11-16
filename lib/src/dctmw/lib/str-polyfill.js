define([], function () {
  'use strict';
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, selfLen) {
      if (selfLen === undefined || selfLen > this.length) {
        selfLen = this.length;
      }
      return this.substring(selfLen - search.length, selfLen) === search;
    };
  }

  if(!String.prototype.startsWith) {
    String.prototype.startsWith = function(search, startIndex) {
      return (this.indexOf(search, startIndex) === 0);
    };
  }
});