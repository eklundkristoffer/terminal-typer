class Type {
    constructor (options = {}) {
        this.options = options;
        this.typingIndex = 0;
        this.lines = [];
    }

    addLine (line) {
        var defaultLine = {
            text: null,
            response: null,
            typing: false,
            finished: false,
            delayUntilTypingStart: 700,
            start: function () {},
            end: function () {},
        }

        this.lines.push({ ...defaultLine, ...line });
    }

    lineSymbolElement () {
        var node = document.createElement('span');
        node.classList.add('typer-symbol');
        node.innerHTML = '>';
        return node;
    }

    lineCursorElement() {
        var node = document.createElement('span');
        node.classList.add('typer-cursor');
        node.innerHTML = '_';
        return node;
    }

    lineElement (lineCount, line) {
        var node = document.createElement('p');
        node.classList.add('typer-item');
        node.setAttribute('data-typer-line', lineCount);
        node.appendChild(this.lineSymbolElement());
        node.appendChild(this.textElement(line.text));
        node.appendChild(this.lineCursorElement());

        if (lineCount !== 1) {
            node.classList.add('typer-item-hidden');
        }

        if (lineCount === 1) {
            node.classList.add('typer-item-typing');
        }

        return node;
    }

    textElement (text) {
        var node = document.createElement('span');
        node.classList.add('typer-text');
        return node;
    }

    responseElement(lineCount, line) {
        var node = document.createElement('div');
        node.classList.add('typer-response');
        node.setAttribute('data-typer-line-response', lineCount);
        node.innerHTML = line.response;
        return node;
    }

    container () {
        return this.options.container;
    }

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async writer (element, text, speed = 50) {
        if (text === null) {
            return;
        }

        while  (this.typingIndex < text.length) {
            element.innerHTML += text.charAt(this.typingIndex);
            this.typingIndex++;
            await this.sleep(speed);
        }
    }

    async type (lineCount, line) {
        var lineElement = document.querySelectorAll(`[data-typer-line='${lineCount}']`)[0];
        var lineTextElement = lineElement.querySelectorAll('.typer-text')[0];
        var responseElement = document.querySelectorAll(`[data-typer-line-response='${lineCount}']`)[0];

        await this.writer(lineTextElement, line.text);
        await this.sleep(500);

        line.typing = false;
        line.finished = true;
        this.typingIndex = 0;

        if (line.response !== null) {
            responseElement.classList.add('typer-response-show');
        }

        if (this.lines[lineCount] !== undefined) {
            lineElement.classList.toggle('typer-item-typing');
            var nextLineElement = document.querySelectorAll(`[data-typer-line='${lineCount + 1}']`)[0];
            nextLineElement.classList.remove('typer-item-hidden');
            nextLineElement.classList.add('typer-item-typing');
        }

        return new Promise(resolve => {
            resolve();
        });
    }

    typingIsBusy () {
        return this.lines.find(line => line.typing === true) !== undefined;
    }

    async startTyping (lineIndex = 0) {
        var line = this.lines[lineIndex];

        if (line === undefined) {
            return false;
        }

        if (this.typingIsBusy() || line.finished) {
            return false;
        }

        await this.sleep(line.delayUntilTypingStart || 700);

        line.typing = true;

        if (typeof line.before === 'function') {
            await line.before();
        }

        this.type(lineIndex + 1, line).then(async () => {
            if (typeof line.after === 'function') {
                await line.after();
            }

            this.startTyping(lineIndex + 1);
        });
    }

    start () {
        this.addLine({});

        this.lines.forEach((line, index) => {
            var lineCount = index + 1;
            var lineElement = this.lineElement(lineCount, line);
            var responseElement = this.responseElement(lineCount, line);
            this.container().appendChild(lineElement);

            if (line.response !== null) {
                this.container().appendChild(responseElement);
            }
        });

        this.startTyping();
    }
}

(function() {
    var typer = new Type({
        container: document.getElementById('typer-screen')
    });

    typer.addLine({
        text: 'php artisan developer:name',
        response: '"Kristoffer Eklund"'
    });

    typer.addLine({
        text: 'php artisan developer:age',
        response: '"26"'
    });

    typer.addLine({
        text: 'php artisan developer:location',
        response: '"Stockholm, Sweden"'
    });

    typer.addLine({
        text: 'php artisan vendor:publish',
        response: '"Stockholm, Sweden"'
    })

    typer.start();
})();
