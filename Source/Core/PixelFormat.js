/*global define*/
define([
        '../Renderer/WebGLConstants',
        './freezeObject'
    ], function(
        WebGLConstants,
        freezeObject) {
    'use strict';

    /**
     * The format of a pixel, i.e., the number of components it has and what they represent.
     *
     * @exports PixelFormat
     */
    var PixelFormat = {
        /**
         * A pixel format containing a depth value.
         *
         * @type {Number}
         * @constant
         */
        DEPTH_COMPONENT : WebGLConstants.DEPTH_COMPONENT,

        /**
         * A pixel format containing a depth and stencil value, most often used with {@link PixelDatatype.UNSIGNED_INT_24_8}.
         *
         * @type {Number}
         * @constant
         */
        DEPTH_STENCIL : WebGLConstants.DEPTH_STENCIL,

        /**
         * A pixel format containing an alpha channel.
         *
         * @type {Number}
         * @constant
         */
        ALPHA : WebGLConstants.ALPHA,

        /**
         * A pixel format containing red, green, and blue channels.
         *
         * @type {Number}
         * @constant
         */
        RGB : WebGLConstants.RGB,

        /**
         * A pixel format containing red, green, blue, and alpha channels.
         *
         * @type {Number}
         * @constant
         */
        RGBA : WebGLConstants.RGBA,

        /**
         * A pixel format containing a luminance (intensity) channel.
         *
         * @type {Number}
         * @constant
         */
        LUMINANCE : WebGLConstants.LUMINANCE,

        /**
         * A pixel format containing luminance (intensity) and alpha channels.
         *
         * @type {Number}
         * @constant
         */
        LUMINANCE_ALPHA : WebGLConstants.LUMINANCE_ALPHA,

        RGB_DXT1 : WebGLConstants.COMPRESSED_RGB_S3TC_DXT1_EXT,
        RGBA_DXT1 : WebGLConstants.COMPRESSED_RGBA_S3TC_DXT1_EXT,
        RGBA_DXT3 : WebGLConstants.COMPRESSED_RGBA_S3TC_DXT3_EXT,
        RGBA_DXT5 : WebGLConstants.COMPRESSED_RGBA_S3TC_DXT5_EXT,
        RGB_PVRTC_4BPPV1 : WebGLConstants.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
        RGB_PVRTC_2BPPV1 : WebGLConstants.COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
        RGBA_PVRTC_4BPPV1 : WebGLConstants.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
        RGBA_PVRTC_2BPPV1 : WebGLConstants.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
        RGB_ETC1 : WebGLConstants.COMPRESSED_RGB_ETC1_WEBGL,

        /**
         * @private
         */
        validate : function(pixelFormat) {
            return pixelFormat === PixelFormat.DEPTH_COMPONENT ||
                   pixelFormat === PixelFormat.DEPTH_STENCIL ||
                   pixelFormat === PixelFormat.ALPHA ||
                   pixelFormat === PixelFormat.RGB ||
                   pixelFormat === PixelFormat.RGBA ||
                   pixelFormat === PixelFormat.LUMINANCE ||
                   pixelFormat === PixelFormat.LUMINANCE_ALPHA ||
                   pixelFormat === PixelFormat.RGB_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT3 ||
                   pixelFormat === PixelFormat.RGBA_DXT5 ||
                   pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
                   pixelFormat === PixelFormat.RGB_ETC1;
        },

        /**
         * @private
         */
        isColorFormat : function(pixelFormat) {
            return pixelFormat === PixelFormat.ALPHA ||
                   pixelFormat === PixelFormat.RGB ||
                   pixelFormat === PixelFormat.RGBA ||
                   pixelFormat === PixelFormat.LUMINANCE ||
                   pixelFormat === PixelFormat.LUMINANCE_ALPHA;
        },

        /**
         * @private
         */
        isDepthFormat : function(pixelFormat) {
            return pixelFormat === PixelFormat.DEPTH_COMPONENT ||
                   pixelFormat === PixelFormat.DEPTH_STENCIL;
        },

        isCompressedFormat : function(pixelFormat) {
            return pixelFormat === PixelFormat.RGB_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT3 ||
                   pixelFormat === PixelFormat.RGBA_DXT5 ||
                   pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
                   pixelFormat === PixelFormat.RGB_ETC1;
        },

        isDXTFormat : function(pixelFormat) {
            return pixelFormat === PixelFormat.RGB_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT1 ||
                   pixelFormat === PixelFormat.RGBA_DXT3 ||
                   pixelFormat === PixelFormat.RGBA_DXT5;
        },

        isPVRTCFormat : function(pixelFormat) {
            return pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
                   pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1;
        },

        isETC1Format : function(pixelFormat) {
            return pixelFormat === PixelFormat.RGB_ETC1;
        }
    };

    return freezeObject(PixelFormat);
});
