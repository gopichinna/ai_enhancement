/**
 * @license d2sv-sdk 25.4.0 Copyright © 2023 Open Text. All rights reserved. Trademarks owned by Open Text. 
 */
define([
  'd2/utils/test/common.core.mock'
], function (CommonCoreMock) {
  'use strict';

  /**
   * Not a part of D2 Smart View application runtime, rather it helps in writing unit tests.
   *
   * CommonMock abstracts out few common setup & tear-down for every unit test case written.
   *
   * @example <caption>With common.mock, structure of a unit test mymodule.spec.js could be look like</caption>
   * define(['d2/sdk/utils/test/common.mock'], function(commonMock){
   *    'use strict';
   *
   *    describe("My module", function(){
   *
   *      // Outermost setup
   *      beforeAll(function(){
   *        commonMock.enable();
   *
   *        //ohter setup code
   *      });
   *
   *      // Outermost teardown
   *      afterAll(function(){
   *        commonMock.disable();
   *
   *        //ohter teardown code
   *      });
   *
   *      describe("some group", function(){
   *         it("test1", function(){
   *            // test code
   *         });
   *
   *         it("test2", function(){
   *            // test code
   *         });
   *
   *         // any other test for this group could go here
   *      });
   *
   *      it("test3", function(){
   *        // this test is not grouped
   *        // test code
   *      });
   *    });
   * });
   *
   * @module {d2/sdk/utils/test/common.mock} d2/sdk/utils/test/"common.mock"
   * @name CommonMock
   * @extends {Object}
   */

  return {
    /**
     * Enables the common mock APIs. Should be called while setting-up unit test.
     * @memberOf module:CommonMock
     */
    enable: function() {
      CommonCoreMock.enable();
    },

    /**
     * Disables the common mock APIs. Should be called while tearing-down a unit test.
     * @memberOf module:CommonMock
     */
    disable: function() {
      CommonCoreMock.disable();
    }
  };
});
