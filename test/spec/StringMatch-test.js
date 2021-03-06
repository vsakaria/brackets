/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, require: false, describe: false, it: false, xit: false, expect: false, beforeEach: false, afterEach: false, waitsFor: false, runs: false, jasmine: false */
/*unittests: StringMatch */

define(function (require, exports, module) {
    'use strict';
    
    var StringMatch = require("utils/StringMatch");
    
    describe("StringMatch", function () {
        
        StringMatch._setDebugScores(false);
        
        describe("findSpecialCharacters", function () {
            it("should find the important match characters in the string", function () {
                var fSC = StringMatch._findSpecialCharacters;
                expect(fSC("src/document/DocumentCommandHandler.js")).toEqual({
                    lastSegmentSpecialsIndex: 4,
                    specials: [0, 3, 4, 12, 13, 21, 28, 35, 36]
                });
                
                expect(fSC("foobar.js")).toEqual({
                    lastSegmentSpecialsIndex: 0,
                    specials: [0, 6, 7]
                });
                
                expect(fSC("foo")).toEqual({
                    lastSegmentSpecialsIndex: 0,
                    specials: [0]
                });
            });
        });
        
        describe("_generateMatchList", function () {
            var fSC = StringMatch._findSpecialCharacters;
            var generateMatchList = StringMatch._generateMatchList;
            var SpecialMatch = StringMatch._SpecialMatch;
            var NormalMatch = StringMatch._NormalMatch;
            
            beforeEach(function () {
                SpecialMatch.prototype.type = "special";
                NormalMatch.prototype.type = "normal";
            });
            
            afterEach(function () {
                delete SpecialMatch.prototype.type;
                delete NormalMatch.prototype.type;
            });
            
            var path = "src/document/DocumentCommandHandler.js";
            var specialsInfo = fSC(path);
            path = path.toLowerCase();
            
            it("should return undefined for no matches", function () {
                var result = generateMatchList("foo", path, specialsInfo.specials, 0);
                expect(result).toEqual(null);
            });
            
            it("should return an array with specials matches", function () {
                var result = generateMatchList("d", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new SpecialMatch(13)]);
                
                result = generateMatchList("ch", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new SpecialMatch(21), new SpecialMatch(28)]);
            });
            
            it("should try contiguous matches as well, but prefer specials", function () {
                var result = generateMatchList("do", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new SpecialMatch(13), new NormalMatch(14)]);
                
                result = generateMatchList("doc", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new SpecialMatch(13), new NormalMatch(14), new SpecialMatch(21)]);
                
                result = generateMatchList("doch", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new SpecialMatch(13), new NormalMatch(14), new SpecialMatch(21), new SpecialMatch(28)]);
            });
            
            it("should handle contiguous matches that stand alone", function () {
                var result = generateMatchList("o", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new NormalMatch(14)]);
            });
            
            it("should recognize non-matches", function () {
                var result = generateMatchList("ham", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual(null);
            });
            
            it("should backtrack as needed", function () {
                var result = generateMatchList("cu", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual([new NormalMatch(15), new NormalMatch(16)]);
                
                result = generateMatchList("dcho", path, specialsInfo.specials, specialsInfo.lastSegmentSpecialsIndex);
                expect(result).toEqual(null);
                
                var btpath = "MamoMeMiMoMu";
                var btspecials = fSC(btpath);
                btpath = btpath.toLowerCase();
                
                result = generateMatchList("m", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(0)]);
                
                result = generateMatchList("mu", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(0), new NormalMatch(11)]);
                
                result = generateMatchList("mamo", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(0), new NormalMatch(1), new SpecialMatch(4), new NormalMatch(9)]);
                
                btpath = "AbcdefzBcdefCdefDefEfF";
                btspecials = fSC(btpath);
                btpath = btpath.toLowerCase();
                
                result = generateMatchList("f", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(21)]);
                
                result = generateMatchList("abcdefz", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(0), new NormalMatch(1), new NormalMatch(2), new NormalMatch(3), new NormalMatch(4), new NormalMatch(5), new NormalMatch(6)]);
                
                result = generateMatchList("abcdefe", btpath, btspecials.specials, 0);
                expect(result).toEqual([new SpecialMatch(0), new SpecialMatch(7), new SpecialMatch(12), new SpecialMatch(16), new NormalMatch(17), new NormalMatch(18), new SpecialMatch(19)]);
                
                var str = "_computeRangesAndScore";
                var strSpecials = fSC(str);
                str = str.toLowerCase();
                result = generateMatchList("_computerangesa", str, strSpecials.specials, 0);
                expect(result).toEqual([
                    new SpecialMatch(0), new SpecialMatch(1), new NormalMatch(2),
                    new NormalMatch(3), new NormalMatch(4), new NormalMatch(5),
                    new NormalMatch(6), new NormalMatch(7), new SpecialMatch(8),
                    new NormalMatch(9), new NormalMatch(10), new NormalMatch(11),
                    new NormalMatch(12), new NormalMatch(13), new SpecialMatch(14)
                ]);
            });
                
        });
        
        describe("_computeRangesAndScore", function () {
            var compute = StringMatch._computeRangesAndScore;
            var SpecialMatch = StringMatch._SpecialMatch;
            var NormalMatch = StringMatch._NormalMatch;

            var path = "src/document/DocumentCommandHandler.js";
            
            var matchList = [new SpecialMatch(13)];
            expect(compute(matchList, path, 13)).toEqual({
                matchGoodness: jasmine.any(Number),
                ranges: [
                    { text: "src/document/", matched: false, includesLastSegment: false },
                    { text: "D", matched: true, includesLastSegment: true },
                    { text: "ocumentCommandHandler.js", matched: false, includesLastSegment: true }
                ]
            });
            
            matchList = [new SpecialMatch(13), new NormalMatch(14)];
            expect(compute(matchList, path, 13)).toEqual({
                matchGoodness: jasmine.any(Number),
                ranges: [
                    { text: "src/document/", matched: false, includesLastSegment: false },
                    { text: "Do", matched: true, includesLastSegment: true },
                    { text: "cumentCommandHandler.js", matched: false, includesLastSegment: true }
                ]
            });
                
        });
        
        describe("_lastSegmentSearch", function () {
            var SpecialMatch = StringMatch._SpecialMatch;
            var NormalMatch = StringMatch._NormalMatch;
            beforeEach(function () {
                SpecialMatch.prototype.type = "special";
                NormalMatch.prototype.type = "normal";
            });
            
            afterEach(function () {
                delete SpecialMatch.prototype.type;
                delete NormalMatch.prototype.type;
            });
            
            it("should compare results in the final segment properly", function () {
                var path = "src/document/DocumentCommandHandler.js";
                var comparePath = path.toLowerCase();
                var _lastSegmentSearch = StringMatch._lastSegmentSearch;
                var sc = StringMatch._findSpecialCharacters(path);
                expect(_lastSegmentSearch("d", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13)
                    ]
                });
                
                expect(_lastSegmentSearch("do", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14)
                    ]
                });
                
                expect(_lastSegmentSearch("doc", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14),
                        new SpecialMatch(21)
                    ]
                });
                
                expect(_lastSegmentSearch("docc", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14),
                        new NormalMatch(15),
                        new SpecialMatch(21)
                    ]
                });

                expect(_lastSegmentSearch("docch", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14),
                        new NormalMatch(15),
                        new SpecialMatch(21),
                        new SpecialMatch(28)
                    ]
                });
                
                expect(_lastSegmentSearch("docch.js", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14),
                        new NormalMatch(15),
                        new SpecialMatch(21),
                        new SpecialMatch(28),
                        new SpecialMatch(35),
                        new SpecialMatch(36),
                        new NormalMatch(37)
                    ]
                });
                
                expect(_lastSegmentSearch("ocu", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new NormalMatch(14),
                        new NormalMatch(15),
                        new NormalMatch(16)
                    ]
                });
                
                expect(_lastSegmentSearch("ocuha", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "",
                    matchList: [
                        new NormalMatch(14),
                        new NormalMatch(15),
                        new NormalMatch(16),
                        new SpecialMatch(28),
                        new NormalMatch(29)
                    ]
                });
                
                expect(_lastSegmentSearch("z", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                expect(_lastSegmentSearch("ocuz", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                
                expect(_lastSegmentSearch("sdoc", comparePath, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual({
                    remainder: "s",
                    matchList: [
                        new SpecialMatch(13),
                        new NormalMatch(14),
                        new SpecialMatch(21)
                    ]
                });
            });
            
            it("should handle weird comparisons as well", function () {
                // this is a special case, to ensure that a "special" character following
                // other matched characters doesn't become a match
                // note that the d's in Command and Handler have been removed
                var path = "DocumentCommanHanler.js";
                var comparePath = path.toLowerCase();
                var _lastSegmentSearch = StringMatch._lastSegmentSearch;
                var sc = StringMatch._findSpecialCharacters(path);
                expect(_lastSegmentSearch("ocud", comparePath, sc.specials, 0)).toEqual(null);
            });
            
            it("should compare matches that don't fit in just the final segment", function () {
                var path = "src/document/DocumentCommandHandler.js";
                
                var wholeStringSearch = StringMatch._wholeStringSearch;
                var sc = StringMatch._findSpecialCharacters(path);
                
                expect(wholeStringSearch("sdoc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(0),
                    new SpecialMatch(13),
                    new NormalMatch(14),
                    new SpecialMatch(21)
                ]);
                
                expect(wholeStringSearch("doc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(13),
                    new NormalMatch(14),
                    new SpecialMatch(21)
                ]);
                
                expect(wholeStringSearch("z", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
                
                expect(wholeStringSearch("docdoc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(4),
                    new NormalMatch(5),
                    new NormalMatch(6),
                    new SpecialMatch(13),
                    new NormalMatch(14),
                    new SpecialMatch(21)
                ]);
                
                // test for a suspected bug where specials are matched out of order.
                expect(wholeStringSearch("hc", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual(null);
            });
            
            it("should handle matches that don't fit at all in the final segment", function () {
                var path = "src/extensions/default/QuickOpenCSS/main.js";
                
                var wholeStringSearch = StringMatch._wholeStringSearch;
                var sc = StringMatch._findSpecialCharacters(path);
                
                expect(wholeStringSearch("quick", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(23),
                    new NormalMatch(24),
                    new NormalMatch(25),
                    new NormalMatch(26),
                    new NormalMatch(27)
                ]);
                
                expect(wholeStringSearch("quickopen", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(23),
                    new NormalMatch(24),
                    new NormalMatch(25),
                    new NormalMatch(26),
                    new NormalMatch(27),
                    new SpecialMatch(28),
                    new NormalMatch(29),
                    new NormalMatch(30),
                    new NormalMatch(39)
                ]);
                                
                expect(wholeStringSearch("quickopenain", path, sc.specials, sc.lastSegmentSpecialsIndex)).toEqual([
                    new SpecialMatch(23),
                    new NormalMatch(24),
                    new NormalMatch(25),
                    new NormalMatch(26),
                    new NormalMatch(27),
                    new SpecialMatch(28),
                    new NormalMatch(29),
                    new NormalMatch(30),
                    new NormalMatch(31),
                    new NormalMatch(37),
                    new NormalMatch(38),
                    new NormalMatch(39)
                ]);
            });
        });
        
        describe("stringMatch", function () {
            var stringMatch = StringMatch.stringMatch;
            
            it("should return appropriate matching ranges", function () {
                var result;
                
                expect(stringMatch("foo/bar/baz.js", "bingo")).toBeUndefined();
                
                result = stringMatch("foo/bar/baz.js", "fbb.js");
                expect(result).not.toBeUndefined();
                expect(result.matchGoodness).toBeLessThan(-100);
                var ranges = result.stringRanges;
                expect(ranges.length).toBe(7);
                
                // verify the important bit of the ranges
                var range = ranges.shift();
                expect(range.text).toBe("f");
                expect(range.matched).toBe(true);
                
                range = ranges.shift();
                expect(range.text).toBe("oo/");
                expect(range.matched).toBe(false);
                
                range = ranges.shift();
                expect(range.text).toBe("b");
                expect(range.matched).toBe(true);
                
                result = stringMatch("src/extensions/default/QuickOpenCSS/main.js", "quick");
                ranges = result.stringRanges;
                expect(ranges.length).toBe(3);
                
                expect(stringMatch("src/search/QuickOpen.js", "qo")).toEqual({
                    matchGoodness: jasmine.any(Number),
                    label: "src/search/QuickOpen.js",
                    stringRanges: [
                        { text: "src/search/", matched: false, includesLastSegment: false },
                        { text: "Q", matched: true, includesLastSegment: true },
                        { text: "uick", matched: false, includesLastSegment: true },
                        { text: "O", matched: true, includesLastSegment: true },
                        { text: "pen.js", matched: false, includesLastSegment: true }
                    ]
                });
                
                expect(stringMatch("MoonsunSum", "sun")).toEqual({
                    matchGoodness: jasmine.any(Number),
                    label: "MoonsunSum",
                    stringRanges: [
                        { text: "Moon", matched: false, includesLastSegment: true },
                        { text: "sun", matched: true, includesLastSegment: true },
                        { text: "Sum", matched: false, includesLastSegment: true }
                    ]
                });
            });
            
            it("should prefer special characters", function () {
                expect(stringMatch("src/document/DocumentCommandHandler.js", "dch")).toEqual({
                    matchGoodness: jasmine.any(Number),
                    label: "src/document/DocumentCommandHandler.js",
                    stringRanges: [
                        { text: "src/document/", matched: false, includesLastSegment: false },
                        { text: "D", matched: true, includesLastSegment: true },
                        { text: "ocument", matched: false, includesLastSegment: true },
                        { text: "C", matched: true, includesLastSegment: true },
                        { text: "ommand", matched: false, includesLastSegment: true },
                        { text: "H", matched: true, includesLastSegment: true },
                        { text: "andler.js", matched: false, includesLastSegment: true }
                    ]
                });
            });
            
            var goodRelativeOrdering = function (query, testStrings) {
                var lastScore = -Infinity;
                var goodOrdering = true;
                testStrings.forEach(function (str) {
                    var result = stringMatch(str, query);
                    
                    // note that matchGoodness is expressed in negative numbers
                    if (result.matchGoodness < lastScore) {
                        goodOrdering = false;
                    }
                    lastScore = result.matchGoodness;
                });
                return goodOrdering;
            };
            
            it("should place QuickOpen well relative to other quicks", function () {
                expect(goodRelativeOrdering("quick", [
                    "src/search/QuickOpen.js",
                    "test/spec/QuickOpen-test.js",
                    "samples/root/Getting Started/screenshots/brackets-quick-edit.png",
                    "src/extensions/default/QuickOpenCSS/main.js"
                ])).toBe(true);
            });
            
            it("should find the right spec/live", function () {
                expect(goodRelativeOrdering("spec/live", [
                    "test/spec/LiveDevelopment-test.js",
                    "test/spec/LiveDevelopment-chrome-user-data/Default/VisitedLinks"
                ])).toBe(true);
            });
            
            it("should find the right samples/index", function () {
                expect(goodRelativeOrdering("samples/index", [
                    "samples/de/Erste Schritte/index.html",
                    "src/thirdparty/CodeMirror2/mode/ntriples/index.html"
                ])).toBe(true);
            });
            
            it("should find the right Commands", function () {
                expect(goodRelativeOrdering("Commands", [
                    "src/command/Commands.js",
                    "src/command/CommandManager.js"
                ])).toBe(true);
            });
            
            it("should find the right extensions", function () {
                expect(goodRelativeOrdering("extensions", [
                    "src/utils/ExtensionLoader.js",
                    "src/extensions/default/RecentProjects/styles.css"
                ])).toBe(true);
            });
            
            it("should find the right EUtil", function () {
                expect(goodRelativeOrdering("EUtil", [
                    "src/editor/EditorUtils.js",
                    "src/utils/ExtensionUtils.js",
                    "src/file/FileUtils.js"
                ])).toBe(true);
            });
            
            it("should find the right ECH", function () {
                expect(goodRelativeOrdering("ECH", [
                    "EditorCommandHandlers",
                    "EditorCommandHandlers-test",
                    "SpecHelper"
                ])).toBe(true);
            });
            
            it("should find the right DMan", function () {
                expect(goodRelativeOrdering("DMan", [
                    "DocumentManager",
                    "CommandManager"
                ])).toBe(true);
            });
            
            it("should find the right sru", function () {
                expect(goodRelativeOrdering("sru", [
                    "test/spec/SpecRunnerUtils.js",
                    "test/SpecRunner.html"
                ])).toBe(true);
            });
            
            it("should find the right jsutil", function () {
                expect(goodRelativeOrdering("jsutil", [
                    "src/language/JSUtil.js",
                    "src/language/JSLintUtils.js"
                ])).toBe(true);
            });
            
            it("should find the right jsu", function () {
                expect(goodRelativeOrdering("jsu", [
                    "src/language/JSLintUtils.js",
                    "src/language/JSUtil.js"
                ])).toBe(true);
            });
        });
        
        describe("scoring", function () {
            beforeEach(function () {
                StringMatch._setDebugScores(true);
            });
            
            afterEach(function () {
                StringMatch._setDebugScores(false);
            });
            
            it("should score consecutive matches across the last segment", function () {
                var result1 = StringMatch.stringMatch("test/spec/LiveDevelopment-test.js", "spec/live");
                var result2 = StringMatch.stringMatch("test/spec/live/foobar.js", "spec/live");
                expect(result2.scoreDebug.consecutive).toEqual(result1.scoreDebug.consecutive);
                expect(result2.scoreDebug.consecutive).toBeGreaterThan(0);
                expect(result2.scoreDebug.notStartingOnSpecial).toEqual(0);
            });
            
            it("should boost last segment matches, even when searching the whole string", function () {
                var result = StringMatch.stringMatch("src/extensions/default/QuickOpenCSS/main.js", "quickopenain");
                expect(result.scoreDebug.lastSegment).toBeGreaterThan(0);
                expect(result.scoreDebug.notStartingOnSpecial).toEqual(-25);
            });
            
            it("should treat the character after _ as a special", function () {
                var result = StringMatch.stringMatch("src/extensions/default/Quick_Open.js", "o");
                expect(result.scoreDebug.special).toBeGreaterThan(0);
            });
            
            it("should penalize matches that don't start on a special", function () {
                var result = StringMatch.stringMatch("src/thirdparty/CodeMirror2/mode/ntriples/index.html", "samples/index");
                expect(result.scoreDebug.notStartingOnSpecial).toEqual(-50);
                
                result = StringMatch.stringMatch("src/thirdparty/CodeMirror2/mode/ntriples/index.html", "codemirror");
                expect(result.scoreDebug.notStartingOnSpecial).toEqual(0);
            });
            
            it("should try to prioritize points for the last segment", function () {
                var result = StringMatch.stringMatch("abc/def/zzz/abc/def", "abc/def");
                expect(result.scoreDebug.lastSegment).toBeGreaterThan(0);
            });
        });
        
        describe("StringMatcher", function () {
            it("should manage its caches properly", function () {
                this.addMatchers({
                    toBeInCache: function (matcher, cacheName) {
                        var value = matcher[cacheName][this.actual];
                        var notText = this.isNot ? " not" : "";
                        
                        this.message = function () {
                            return "Expected " + cacheName + " to" + notText + " contain key " + this.actual;
                        };
                        
                        return value !== undefined;
                    }
                });
                
                var matcher = new StringMatch.StringMatcher();
                expect(matcher._noMatchCache).toEqual({});
                expect(matcher._specialsCache).toEqual({});
                
                matcher.match("test/spec/LiveDevelopment-test.js", "spec/live");
                expect("test/spec/LiveDevelopment-test.js").toBeInCache(matcher, "_specialsCache");
                expect("test/spec/LiveDevelopment-test.js").not.toBeInCache(matcher, "_noMatchCache");
                
                matcher.match("foo", "spec/live");
                expect("foo").toBeInCache(matcher, "_specialsCache");
                expect("foo").toBeInCache(matcher, "_noMatchCache");
                
                matcher.match("test/spec/LiveDevelopment-test.js", "spec/lived");
                // verify that the noMatchCache is still populated
                expect("foo").toBeInCache(matcher, "_noMatchCache");
                
                // a shorter/different string should invalidate the noMatchCache
                // but not the specialsCache
                matcher.match("test/spec/LiveDevelopment-test.js", "spec/liv");
                expect("foo").toBeInCache(matcher, "_specialsCache");
                expect("foo").not.toBeInCache(matcher, "_noMatchCache");
            });
            
            it("should handle collisions with built-in members", function () {
                var matcher = new StringMatch.StringMatcher();
                
                // Object.prototype has toString
                var toStringResult = matcher.match("toString", "t");
                expect(toStringResult).toBeTruthy();
                
                // Array.prototype has length
                var lengthResult = matcher.match("length", "l");
                expect(lengthResult).toBeTruthy();
            });
        });
    });
});
