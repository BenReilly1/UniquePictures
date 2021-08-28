const argv = require('yargs').argv
const FS = require("fs");
const Path = require("path");
var ExifImage = require('exif').ExifImage;
const { imageHash }= require('image-hash');
const { copyFileSync } = require('fs')

let Files  = [];
let CreateDate = [];
let FileHashes = [];

// Gets all files, pushes found images into Files Array.
// Called from main function
function ThroughDirectory(Directory) { 
    FS.readdirSync(Directory).forEach(File => {
        const Absolute = Path.join(Directory, File);
        if (FS.statSync(Absolute).isDirectory()) {
            return ThroughDirectory(Absolute)
        } else {
            var splitString = Absolute.split('\\')
            var fileType = checkFiletype(splitString[splitString.length - 1])
            if (fileType) {
                var obj = {
                    full: Absolute,
                    fileName: splitString[splitString.length - 1]
                }
                return Files.push(obj)
            }
        }
    });
}

// Checks file extension, returns either true or false
// Called from ThroughDirectory function
function checkFiletype(fileName) {
    var fileExtensions = ['jpeg', 'jpg', 'gif', 'png', 'esp', 'ai', 'pdf', 'tiff', 'psd', 'eps', 'indd', 'raw']
    var getExtension = fileName.split('.')
    var extension = getExtension[getExtension.length - 1].toLowerCase()
    return fileExtensions.includes(extension);
}

// Extracts the meta data and goes to next function
// Called from main function
function extractMetadata(full) {
    try {
        new ExifImage({ image : full }, function (error, exifData) {
            if (error) {
                console.log('Error: '+error.message);
                hashFile(full)
            } 
            hashFile(full, exifData.exif)
        });
    } catch (error) {
        console.log('Error: ' + error.message);
        hashFile(full)
    }
}

// Hashes the file
// Called from extractMetadata function
function hashFile(full, meta) {
    // console.log(full)
    // console.log(meta.CreateDate)
    imageHash(full, 16, true, (error, data) => {
        if (error) throw error;
        // console.log(data);
        var fullInformation = {
            full,
            crtDate: meta.CreateDate,
            hash: data
        }
        checkHistory(fullInformation)
    });
}

// Checks history of the file, same create date and hashes. If it fails here it is duplicate
// Called from hashFile function
function checkHistory(fileInformation) {
    var previousDate = CreateDate.includes(fileInformation.crtDate)
    var previousHash = FileHashes.includes(fileInformation.hash)
    if (!previousDate && !previousHash) {
        CreateDate.push(fileInformation.crtDate)
        FileHashes.push(fileInformation.hash)
        moveToOutput(fileInformation)
    } else {
        console.log('Duplicate:', fileInformation.full)
    }
}

// Copy file to new output folder if they are new and not duplicates.
// Called from checkHistory function
function moveToOutput(fileInformation) {
    var getExtension = fileInformation.full.split('.')
    var extension = getExtension[getExtension.length - 1].toLowerCase()
    var crtDate = fileInformation.crtDate
    var parsedDate = crtDate.split(':').join(' ')
    var newName = parsedDate + "." + extension
    var outputString = argv.output + "\\" + newName
    copyFileSync(fileInformation.full, outputString)
}

function main() {
    ThroughDirectory(argv.input);
    console.log(Files.length)
    for(var i = 0; i < Files.length; i++) {
        extractMetadata(Files[i].full)
    }
}

main()