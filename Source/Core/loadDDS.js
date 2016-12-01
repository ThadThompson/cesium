/*global define*/
define([
    '../ThirdParty/when',
    './loadArrayBuffer'
], function(
    when,
    loadArrayBuffer
) {
    'use strict';

    // DDS parsing modified from Brandon Jones' webgl-texture-utils
    // https://github.com/toji/webgl-texture-utils

    /* Copyright (c) 2014, Brandon Jones. All rights reserved.

     Redistribution and use in source and binary forms, with or without modification,
     are permitted provided that the following conditions are met:

     * Redistributions of source code must retain the above copyright notice, this
     list of conditions and the following disclaimer.
     * Redistributions in binary form must reproduce the above copyright notice,
     this list of conditions and the following disclaimer in the documentation
     and/or other materials provided with the distribution.

     THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
     ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
     WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
     DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
     ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
     (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
     LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
     ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
     SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

    // Utility functions
    // Builds a numeric code for a given fourCC string
    function fourCCToInt32(value) {
        return value.charCodeAt(0) +
               (value.charCodeAt(1) << 8) +
               (value.charCodeAt(2) << 16) +
               (value.charCodeAt(3) << 24);
    }

    // Turns a fourCC numeric code into a string
    function int32ToFourCC(value) {
        return String.fromCharCode(
            value & 0xff,
            (value >> 8) & 0xff,
            (value >> 16) & 0xff,
            (value >> 24) & 0xff
        );
    }

    // Calcualates the size of a compressed texture level in bytes
    function textureLevelSize(format, width, height) {
        switch (format) {
            case COMPRESSED_RGB_S3TC_DXT1_EXT:
            case COMPRESSED_RGB_ATC_WEBGL:
            //case COMPRESSED_RGB_ETC1_WEBGL:
                return ((width + 3) >> 2) * ((height + 3) >> 2) * 8;

            case COMPRESSED_RGBA_S3TC_DXT3_EXT:
            case COMPRESSED_RGBA_S3TC_DXT5_EXT:
            case COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL:
            case COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL:
                return ((width + 3) >> 2) * ((height + 3) >> 2) * 16;

            /*
            case COMPRESSED_RGB_PVRTC_4BPPV1_IMG:
            case COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:
                return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

            case COMPRESSED_RGB_PVRTC_2BPPV1_IMG:
            case COMPRESSED_RGBA_PVRTC_2BPPV1_IMG:
                return Math.floor((Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8);
            */

            default:
                return 0;
        }
    }

    // DXT formats, from:
    // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
    var COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
    //var COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
    var COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
    var COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

    // ATC formats, from:
    // http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_atc/
    var COMPRESSED_RGB_ATC_WEBGL                     = 0x8C92;
    var COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL     = 0x8C93;
    var COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

    // DXT values and structures referenced from:
    // http://msdn.microsoft.com/en-us/library/bb943991.aspx/
    var DDS_MAGIC = 0x20534444;
    var DDSD_MIPMAPCOUNT = 0x20000;
    var DDPF_FOURCC = 0x4;

    var DDS_HEADER_LENGTH = 31; // The header length in 32 bit ints.

    // Offsets into the header array.
    var DDS_HEADER_MAGIC = 0;

    var DDS_HEADER_SIZE = 1;
    var DDS_HEADER_FLAGS = 2;
    var DDS_HEADER_HEIGHT = 3;
    var DDS_HEADER_WIDTH = 4;

    var DDS_HEADER_MIPMAPCOUNT = 7;

    var DDS_HEADER_PF_FLAGS = 20;
    var DDS_HEADER_PF_FOURCC = 21;

    // FourCC format identifiers.
    var FOURCC_DXT1 = fourCCToInt32("DXT1");
    var FOURCC_DXT3 = fourCCToInt32("DXT3");
    var FOURCC_DXT5 = fourCCToInt32("DXT5");

    var FOURCC_ATC = fourCCToInt32("ATC ");
    var FOURCC_ATCA = fourCCToInt32("ATCA");
    var FOURCC_ATCI = fourCCToInt32("ATCI");

    // Parse a DDS file and provide information about the raw DXT data it contains to the given callback.
    function parseDDS(arrayBuffer, callback, errorCallback) {
        // Callbacks must be provided.
        if (!callback || !errorCallback) { return; }

        // Get a view of the arrayBuffer that represents the DDS header.
        var header = new Int32Array(arrayBuffer, 0, DDS_HEADER_LENGTH);

        // Do some sanity checks to make sure this is a valid DDS file.
        if(header[DDS_HEADER_MAGIC] !== DDS_MAGIC) {
            errorCallback("Invalid magic number in DDS header");
            return 0;
        }

        if(!header[DDS_HEADER_PF_FLAGS] & DDPF_FOURCC) {
            errorCallback("Unsupported format, must contain a FourCC code");
            return 0;
        }

        // Determine what type of compressed data the file contains.
        var fourCC = header[DDS_HEADER_PF_FOURCC];
        var internalFormat;
        switch(fourCC) {
            case FOURCC_DXT1:
                internalFormat = COMPRESSED_RGB_S3TC_DXT1_EXT;
                break;

            case FOURCC_DXT3:
                internalFormat = COMPRESSED_RGBA_S3TC_DXT3_EXT;
                break;

            case FOURCC_DXT5:
                internalFormat = COMPRESSED_RGBA_S3TC_DXT5_EXT;
                break;

            case FOURCC_ATC:
                internalFormat = COMPRESSED_RGB_ATC_WEBGL;
                break;

            case FOURCC_ATCA:
                internalFormat = COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL;
                break;

            case FOURCC_ATCI:
                internalFormat = COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
                break;


            default:
                errorCallback("Unsupported FourCC code: " + int32ToFourCC(fourCC));
                return;
        }

        // Determine how many mipmap levels the file contains.
        var levels = 1;
        if(header[DDS_HEADER_FLAGS] & DDSD_MIPMAPCOUNT) {
            levels = Math.max(1, header[DDS_HEADER_MIPMAPCOUNT]);
        }

        // Gather other basic metrics and a view of the raw the DXT data.
        var width = header[DDS_HEADER_WIDTH];
        var height = header[DDS_HEADER_HEIGHT];
        var dataOffset = header[DDS_HEADER_SIZE] + 4;
        var dxtData = new Uint8Array(arrayBuffer, dataOffset);

        // Pass the DXT information to the callback for uploading.
        callback(dxtData, width, height, levels, internalFormat);
    }

    function loadDDS(url) {
        return loadArrayBuffer(url).then(function(data) {
            var deferred = when.defer();

            var onloadCallback = function(dxtData, width, height, levels, internalFormat) {
                // TODO: handle mipmaps
                if (levels > 1) {
                    var levelSize = textureLevelSize(internalFormat, width, height);
                    dxtData = new Uint8Array(data.buffer, data.byteOffset, levelSize);
                }
                deferred.resolve({
                    bufferView : dxtData,
                    width : width,
                    height : height,
                    internalFormat : internalFormat
                });
            };
            var onErrorCallback = function(errorMsg) {
                deferred.reject(errorMsg);
            };
            parseDDS(data, onloadCallback, onErrorCallback);

            return deferred.promise;
        });
    }

    return loadDDS;
});