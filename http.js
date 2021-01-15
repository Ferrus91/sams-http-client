const net = require('net');
const fs = require('fs');

const server = net.createServer((socket) => {
        const lineBreak = '\r\n';
        socket.setEncoding('binary')
        socket.on('data', (data) => {
            const buf = Buffer.from(data)
            let result = '';
            for (const item of buf) {
                result += String.fromCharCode(item);
            }
            const headerMap = new Map();
            const lines = result.split(lineBreak);
            const openingHeader = lines.shift();
            const [verb, path, version] = openingHeader.split(' ');;
            let currLine = lines.shift();
            while (currLine != '') {
                const splitHeader = currLine.split(':').map(val => val.trim());
                headerMap.set(splitHeader[0], splitHeader[1]);
                currLine = lines.shift();
            }
            const content = lines.join(lineBreak);
            if (verb === 'POST') {
                const formMap = new Map();
                const contentType = headerMap.get('Content-Type');
                if (contentType.startsWith('multipart/form-data; ')) {
                    const boundaryRegEx = /boundary=(.*)/;
                    const boundaryMatch = boundaryRegEx.exec(data);
                    const boundary = boundaryMatch[1];
                    const formData = data.split(boundary).filter(val => val.includes('Content-Disposition: form-data'));
                    formData.map((line) => {
                        const [header, value] = line.split(lineBreak + lineBreak).map(val => val
                            .replace('^(\r\n)*', '').replace('^(\r\n)*$', '').replace(/--$/,''));
                        const nameRegEx = /name="(.*?)"/;
                        const nameMatch = nameRegEx.exec(header);
                        const name = nameMatch[1];
                        if (header.includes('filename')) {
                            const fileNameRegEx = /filename="(.*?)"/;
                            const fileNameMatch = fileNameRegEx.exec(header);   
                            const fileName = fileNameMatch[1];
                            const buffer = Buffer.from(value, 'binary');
                            fs.writeFile(`${__dirname}/${fileName}`, buffer, { encoding: 'binary' }, (err) => {
                                if (err) throw err;
                                console.log("It's saved!");
                            });
                        } else {
                            formMap.set(name, name);
                        }
                    });
                }
            }
            const date = new Date().toUTCString();
            const response = '<html><body><a href="http://www.google.com">Sam here!</body><html>' + lineBreak;
            const httpMessage = 
                'HTTP/1.1 200 OK' + lineBreak +
                'Date: ' + date + lineBreak +
                'Server: SamsCustomNodeServer/0.0.1 (OSx)' + lineBreak +
                'Last-Modified: ' + date + lineBreak +
                'Content-Length: ' + response.length + lineBreak +
                'Content-Type: text/html; charset=us-ascii' + lineBreak +
                'Connection: Closed' + lineBreak + lineBreak;
            const totalBuffer = Buffer.concat([Buffer.from(httpMessage, 'ascii'), Buffer.from(response, 'ascii')])
            let tbr = '';
            for (const item of totalBuffer) {
                tbr += String.fromCharCode(item);
            }
            socket.write(totalBuffer);
        });    
        }
    ).listen('9202', 'localhost', () => {
        console.log("server accepting connections");
    });
