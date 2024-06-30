const Docker = require("dockerode")
const fs = require("fs")
const path = require("path")
const tar = require("tar-stream")
const readline = require("readline")


const DATABASE_PATH = "/app/src/static/database.db"
const ENV_PATH = "/app/.env"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const pause = () => new Promise((resolve) => {
    rl.question("Appuyez sur Entrée pour terminer...", () => {
        rl.close();
        resolve();
    });
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));


async function copyFiles(containerFilePath, container, extractPath) {
    try {
        const stream = await container.getArchive({ path: containerFilePath})
        const extract = tar.extract()

        extract.on("entry", (header, stream, next) => {
            const filePath = path.join(extractPath, header.name)

            if(header.type === "directory") {
                fs.mkdirSync(filePath, { recursive: true})
                stream.resume()
            } else {
                stream.pipe(fs.createWriteStream(filePath))
            }
            stream.on("end", next)
        })

        extract.on("finish", () => {
            console.log(`${container.id}: extraction terminée`)
        })

        stream.pipe(extract)
    } catch(err) {
        console.error(err)
    }
}

async function main() {

    const backContainerId = await question("Entrez le nom ou l'id du conteneur Docker correspondant au serveur BACKEND de Oneblind: ")
    const frontContainerId = await question("Entrez le nom ou l'id du conteneur Docker correspondant au serveur FRONTEND de Oneblind: ")
    const extractPath = await question("Entrez le chemin de destination des fichiers: ")

    const docker = new Docker({ host: '127.0.0.1', port: 2375 });
    const backContainer = docker.getContainer(backContainerId);
    const frontContainer = docker.getContainer(frontContainerId)
    
    await copyFiles(DATABASE_PATH, backContainer, extractPath)
    await copyFiles(ENV_PATH, frontContainer, extractPath)

    process.stdin.resume();

}

main()