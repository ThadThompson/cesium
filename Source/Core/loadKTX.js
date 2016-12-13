/*global define*/
define([
    '../ThirdParty/when',
    './DeveloperError',
    './loadArrayBuffer',
    './PixelFormat'
], function(
    when,
    DeveloperError,
    loadArrayBuffer,
    PixelFormat
) {
    'use strict';

    function textureLevelSize(format, width, height) {
        switch (format) {
            // TODO: case ATC
            case PixelFormat.RGB_DXT1:
            case PixelFormat.RGBA_DXT1:
            case PixelFormat.RGB_ETC1:
                return ((width + 3) >> 2) * ((height + 3) >> 2) * 8;

            // TODO: case atc explicit alpha, atc interpolated alpha
            case PixelFormat.RGBA_DXT3:
            case PixelFormat.RGBA_DXT5:
                return ((width + 3) >> 2) * ((height + 3) >> 2) * 16;

            case PixelFormat.RGB_PVRTC_4BPPV1:
            case PixelFormat.RGBA_PVRTC_4BPPV1:
                return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

            case PixelFormat.RGB_PVRTC_2BPPV1:
            case PixelFormat.RGBA_PVRTC_2BPPV1:
                return Math.floor((Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8);

            default:
                return 0;
        }
    }

    var fileIdentifier = [0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A];
    var endiannessTest = 0x04030201;

    var sizeOfUint32 = 4;

    function parseKTX(data) {
        var byteBuffer = new Uint8Array(data);

        var isKTX = true;
        for (var i = 0; i < fileIdentifier.length; ++i) {
            if (fileIdentifier[i] !== byteBuffer[i]) {
                isKTX = false;
                break;
            }
        }

        if (!isKTX) {
            throw new DeveloperError('Invalid KTX file.');
        }

        var view = new DataView(data);
        var byteOffset = 12; // skip identifier

        var endianness = view.getUint32(byteOffset, true);
        if (endianness !== endiannessTest) {
            // TODO: Switch endianness
            throw new DeveloperError('File is the wrong endianness.');
        }

        byteOffset += sizeOfUint32;

        var glType = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var glTypeSize = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var glFormat = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var glInternalFormat = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var glBaseInternalFormat = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var pixelWidth = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var pixelHeight = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var pixelDepth = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var numberOfArrayElements = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var numberOfFaces = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var numberOfMipmapLevels = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;
        var bytesOfKeyValueByteSize = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;

        // TODO: read metadata? At least need to check for KTXorientation
        byteOffset += bytesOfKeyValueByteSize;

        var imageSize = view.getUint32(byteOffset, true);
        byteOffset += sizeOfUint32;

        var texture = new Uint8Array(data, byteOffset, imageSize);

        if (!PixelFormat.validate(glInternalFormat)) {
            throw new DeveloperError('glInternalFormat is not a valid format.');
        }

        if (PixelFormat.isCompressedFormat(glInternalFormat)) {
            if (glType !== 0) {
                throw new DeveloperError('glType must be zero when the texture is compressed.');
            }
            if (glTypeSize !== 1) {
                throw new DeveloperError('The type size for compressed textures must be 1.');
            }
            if (glFormat !== 0) {
                throw new DeveloperError('glFormat must be zero when the texture is compressed.');
            }
            if (numberOfMipmapLevels === 0) {
                throw new DeveloperError('Generating mipmaps for a compressed texture is unsupported.');
            }
        } else {
            if (glBaseInternalFormat !== glFormat) {
                throw new DeveloperError('The base internal format must be the same as the format for uncompressed textures.');
            }
        }

        if (pixelDepth !== 0) {
            throw new DeveloperError('3D textures are unsupported.');
        }

        // TODO: support texture arrays and cubemaps
        if (numberOfArrayElements !== 0) {
            throw new DeveloperError('Texture arrays are unsupported.');
        }
        if (numberOfFaces !== 1) {
            throw new DeveloperError('Cubemaps are unsupported.');
        }

        // TODO: multiple mipmap levels
        if (PixelFormat.isCompressedFormat(glInternalFormat) && numberOfMipmapLevels > 1) {
            var levelSize = textureLevelSize(glInternalFormat, pixelWidth, pixelHeight);
            texture = new Uint8Array(texture.buffer, 0, levelSize);
        }

        return {
            bufferView : texture,
            width : pixelWidth,
            height : pixelHeight,
            internalFormat : glInternalFormat
        };
    }

    function loadKTX(urlOrBuffer) {
        var loadPromise;
        if (urlOrBuffer instanceof ArrayBuffer || ArrayBuffer.isView(urlOrBuffer)) {
            loadPromise = when.resolve(urlOrBuffer);
        } else {
            loadPromise = loadArrayBuffer(urlOrBuffer);
        }

        return loadPromise.then(function(data) {
            return parseKTX(data);
        });
    }

    return loadKTX;
});