const { readdirSync, copyFileSync } = require('fs')
const argv = require('yargs').argv
const FS   = require("fs");
const Path = require("path");


let Files  = [];
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
// Called from ThroughDirectory
function checkFiletype(fileName) {
    var fileExtensions = ['jpeg', 'jpg', 'gif', 'png', 'esp', 'ai', 'pdf', 'tiff', 'psd', 'eps', 'indd', 'raw']
    var getExtension = fileName.split('.')
    var extension = getExtension[getExtension.length - 1].toLowerCase()
    return fileExtensions.includes(extension);
}

function main() {
    ThroughDirectory(argv.input);
    console.log(Files)
}

main()