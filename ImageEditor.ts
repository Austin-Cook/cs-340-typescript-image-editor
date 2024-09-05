import { argv } from "process"
import { readFileSync, openSync, writeSync, closeSync } from "fs"


function main() {
    try {
        // node dist/ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}
        let args = argv.slice(2)
        if (args.length < 3) {
            usage()
            return
        }

        let inputFile: string = args[0]
        let outputFile: string = args[1]
        let filter: string = args[2]

        let image: Image = read(inputFile)

        if ((filter === 'motionblur' && args.length !== 4) || (filter !== 'motionblur' && args.length !== 3)) {
            usage()
            return
        }

        if (filter === 'grayscale' || filter === 'greyscale') {
            grayscale(image)
        }
        else if (filter === 'invert') {
            invert(image)
        } else if (filter === 'emboss') {
            emboss(image)
        } else if (filter === 'motionblur') {
            let length = -1
            length = Number(args[3])
            if (length < 0) {
                usage()
                return
            }

            motionblur(image, length)
        } else {
            usage()
            return
        }

        write(image, outputFile)
    } catch (error) {
        console.error(error)
    }
}

function usage() {
    console.log('USAGE: java ImageEditor <in-file> <out-file> <grayscale|invert|emboss|motionblur> {motion-blur-length}')
}

function grayscale(image: Image): void {
    for (let x = 0; x < image.getWidth(); x++) {
        for (let y = 0; y < image.getHeight(); y++) {
            let curColor: Color = image.get(x, y)

            let grayLevel: number = Math.floor((curColor.red + curColor.green + curColor.blue) / 3)
            grayLevel = Math.max(0, Math.min(grayLevel, 255))

            curColor.red = curColor.green = curColor.blue = grayLevel
        }
    }
}

function invert(image: Image): void {
    for (let x = 0; x < image.getWidth(); x++) {
        for (let y = 0; y < image.getHeight(); y++) {
            let curColor: Color = image.get(x, y)

            curColor.red = 255 - curColor.red;
            curColor.green = 255 - curColor.green;
            curColor.blue = 255 - curColor.blue;
        }
    }
}

function emboss(image: Image): void {
    for (let x = image.getWidth() - 1; x >= 0; x--) {
        for (let y = image.getHeight() - 1; y >= 0; y--) {
            let curColor: Color = image.get(x, y)

            let diff = 0
            if (x > 0 && y > 0) {
                let upLeftColor: Color = image.get(x - 1, y - 1);
                if (Math.abs(curColor.red - upLeftColor.red) > Math.abs(diff)) {
                    diff = curColor.red - upLeftColor.red;
                }
                if (Math.abs(curColor.green - upLeftColor.green) > Math.abs(diff)) {
                    diff = curColor.green - upLeftColor.green;
                }
                if (Math.abs(curColor.blue - upLeftColor.blue) > Math.abs(diff)) {
                    diff = curColor.blue - upLeftColor.blue;
                }
            }

            let grayLevel: number = (128 + diff)
            grayLevel = Math.max(0, Math.min(grayLevel, 255));

            curColor.red = curColor.green = curColor.blue = grayLevel
        }
    }
}

function motionblur(image: Image, length: number): void {
    if (length < 1) {
        return;
    }

    for (let x = 0; x < image.getWidth(); x++) {
        for (let y = 0; y < image.getHeight(); y++) {
            let curColor: Color = image.get(x, y)

            let maxX = Math.min(image.getWidth() - 1, x + length - 1)
            for (let i = x + 1; i <= maxX; ++i) {
                let tmpColor: Color = image.get(i, y);
                curColor.red += tmpColor.red;
                curColor.green += tmpColor.green;
                curColor.blue += tmpColor.blue;
            }

            let delta = (maxX - x + 1);
            curColor.red = Math.floor(curColor.red / delta)
            curColor.green = Math.floor(curColor.green / delta)
            curColor.blue = Math.floor(curColor.blue / delta)
        }
    }
}

function read(filePath: string): Image {
    let imageStr: string = readFileSync(filePath, { encoding: 'utf-8' })
    let tokens: string[] = imageStr.split(/\s+/)

    // width & height always 2nd & 3rd vals, respectively
    let width: number = Number(tokens[1])
    let height: number = Number(tokens[2])
    let image: Image = new Image(width, height)

    let i = 4
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let red = Number(tokens[i])
            let green = Number(tokens[i + 1])
            let blue = Number(tokens[i + 2])
            i += 3
            image.set(x, y, red, green, blue)
        }
    }

    return image
}

function write(image: Image, filePath: string): void {
    let arr: string[] = ['P3\n', `${image.getWidth()} `, `${image.getHeight()}\n`, '255\n']
    for (let y = 0; y < image.getHeight(); y++) {
        for (let x = 0; x < image.getWidth(); x++) {
            let color: Color = image.get(x, y);
            arr.push(`${color.red} ${color.green} ${color.blue} `)
        }
        arr.push('\n')
    }

    let fd: number = openSync(filePath, 'w')
    writeSync(fd, arr.join(''))
    closeSync(fd)
}

class Color {
    red: number
    green: number
    blue: number

    constructor() {
        this.red = 0
        this.green = 0
        this.blue = 0
    }
}

class Image {
    pixels: Color[][]

    constructor(width: number, height: number) {
        this.pixels = []
        for (let i = 0; i < width; i++) {
            this.pixels[i] = []
            for (let j = 0; j < height; j++) {
                this.pixels[i][j] = new Color()
            }
        }
    }

    getWidth(): number {
        return this.pixels.length
    }

    getHeight(): number {
        return this.pixels[0].length
    }

    set(x: number, y: number, red: number, green: number, blue: number): void {
        this.pixels[x][y].red = red
        this.pixels[x][y].green = green
        this.pixels[x][y].blue = blue
    }

    get(x: number, y: number): Color {
        return this.pixels[x][y]
    }
}

main()