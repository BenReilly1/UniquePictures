// Execute using
// node .\main.js --output="E:\OutPicture" --input="E:\Pictures\"

const argv = require('yargs').argv
const FS = require("fs");
const Path = require("path");
var ExifImage = require('exif').ExifImage;
const { imageHash }= require('image-hash');
const { copyFileSync } = require('fs')
const crypto = require('crypto');


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
                checkHistNoMeta(full)
            }
            
            hashFile(full, exifData)
        });
    } catch (error) {
        console.log('Error: ' + error.message);
        checkHistNoMeta(full)
    }
}

// Hashes the file
// Called from extractMetadata function
function hashFile(full, meta) {
    if (meta === undefined) {
        checkHistNoMeta(full)
    } else {
        const fileBuffer = FS.readFileSync(full)
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer)
        const hex = hashSum.digest('hex');
        var fullInformation = {
            full,
            crtDate: meta.exif.CreateDate,
            hash: hex
        }
        checkHistory(fullInformation)
    }
}

// Hashes and checks for previous hash.
// Called from extractMegadata on errors
function checkHistNoMeta(full) {
    const fileBuffer = FS.readFileSync(full)
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer)
    const hex = hashSum.digest('hex');
    var previousHash = FileHashes.includes(hex)
    if (!previousHash) {
        FileHashes.push(hex)
        originalNameCopy(full)
    } else {
        duplicateFile(full)
    }
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
        duplicateFile(fileInformation.full)
    }
}


// This function logs duplicates
// Called from checkHistory and checkHistNoMeta
function duplicateFile(full) {
    console.log('Duplicate: ' + full)
    FS.appendFileSync('duplicates.txt', 'Duplicate found: ' + full + '\n');
    var originalName = full
    var cutUp = originalName.split('\\')
    var stringName = "E:\\OutPictureDuplicate\\" + cutUp[cutUp.length - 1]
    // console.log(stringName)
    copyFileSync(full, stringName)
}

// Copy file to new output folder if they are new and not duplicates.
// Called from checkHistory function
function moveToOutput(fileInformation) {
    var getExtension = fileInformation.full.split('.')
    var extension = getExtension[getExtension.length - 1].toLowerCase()
    var crtDate = fileInformation.crtDate
    if (crtDate !== undefined) {
        var parsedDate = crtDate.split(':').join(' ')
        var newName = parsedDate + "." + extension
        var outputString = argv.output + "\\" + newName
        copyFileSync(fileInformation.full, outputString)
        // This is the original filenames saved 
        originalNameCopy(fileInformation.full)
    } else {
        originalNameCopy(fileInformation.full)
    }
}

// This copies the file with original names
// Called from moveToOutput and extractMetaData
function originalNameCopy(full) {
    var originalName = full
    var cutUp = originalName.split('\\')
    var stringName = "E:\\OutPictureOriginal\\" + cutUp[cutUp.length - 1]
    // console.log(stringName)
    copyFileSync(full, stringName)
    console.log('Success: ' + cutUp[cutUp.length - 1])
}

function main() {
    ThroughDirectory(argv.input);
    console.log(Files.length)
    for(var i = 0; i < Files.length; i++) {
        setTask(i)
    }
}

function setTask(i) {
    setTimeout(function() {
        extractMetadata(Files[i].full)
    }, 100 * i);
}

main()