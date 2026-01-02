class ToolClass {
    static tipTimeOut;
    static TipElement;

    /**
     * 显示弹窗，支持输入或查看模式
     * @param {string|Object} text - 显示文本或对象
     * @param {Function} [callback] - 回调函数（输入模式）
     * @param {string} [title] - 弹窗标题
     */
    static print(text, callback, title) {
        // 对象自动转为JSON字符串
        if (typeof text === 'object') {
            text = JSON.stringify(text, null, 2);
        }

        // HTML转义函数
        const escapeHtml = (unsafe) => {
            if (!unsafe) return '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        // 创建遮罩层
        const mask = document.createElement('div');
        Object.assign(mask.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: '10002'
        });
        mask.onclick = () => mask.remove();

        // 判断是否为输入模式
        const isInputMode = typeof callback === 'function';
        const titleText = title || '查看或复制：';
        const actionBtnText = isInputMode ? '确定' : '复制';

        // 构建弹窗HTML
        mask.innerHTML = `
<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:15px;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.15);z-index:10000;width:80%;max-height:70%;min-height:200px;box-sizing:border-box;display:flex;flex-direction:column;">
  <span style="position:absolute;top:10px;right:15px;font-size:18px;cursor:pointer;color:#999" class="close-btn">×</span>
  <label style="display:block;margin:10px 0 8px;font-size:16px;font-weight:bold;color:#333">${titleText}</label>
  <div id="contentArea" style="overflow-y:auto;min-height:80px;white-space:pre-wrap;word-wrap:break-word;flex:1;${isInputMode ? 'user-modify: read-write; -webkit-user-modify: read-write; outline: none; cursor: text;' : ''}">${escapeHtml(text)}</div>
  <div style="margin-top:10px;text-align:right;">
    <button class="cancel-btn" style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;margin-right:5px">取消</button>
    <button id="actionBtn" style="padding:5px 10px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer">${actionBtnText}</button>
  </div>
</div>`;

        document.body.appendChild(mask);

        // 获取核心元素
        const contentArea = mask.querySelector('#contentArea');
        const actionBtn = mask.querySelector('#actionBtn');
        const closeBtn = mask.querySelector('.close-btn');
        const cancelBtn = mask.querySelector('.cancel-btn');

        // 阻止弹窗内部点击冒泡
        const dialog = mask.querySelector('div');
        const stopPropagation = (e) => e.stopPropagation();
        
        dialog.addEventListener('click', stopPropagation);
        
        // 关闭弹窗函数
        const closeDialog = () => mask.remove();
        
        // 绑定按钮事件
        closeBtn.onclick = closeDialog;
        cancelBtn.onclick = closeDialog;
        
        actionBtn.addEventListener('click', () => {
            if (isInputMode) {
                // 输入模式：执行回调
                const result = contentArea.textContent;
                callback(result);
            } else {
                // 查看模式：复制文本
                ToolClass.copy(text);
            }
            closeDialog();
        });
    }

    /**
     * 显示提示信息
     * @param {string} text - 提示文本
     */
    static showTip(text) {
        clearTimeout(this.tipTimeOut);
        
        if (!this.TipElement) {
            this.TipElement = document.createElement('div');
            Object.assign(this.TipElement.style, {
                position: 'fixed',
                top: '30px',
                right: '20px',
                color: 'white',
                padding: '10px',
                background: '#888',
                borderRadius: '4px',
                zIndex: '10001',
                display: 'none'
            });
            
            document.body.appendChild(this.TipElement);
            
            this.TipElement.addEventListener("click", (e) => {
                e.stopPropagation();
                if (window.AdvancedWebTool) {
                    window.AdvancedWebTool.showItemsMenu();
                }
                this.TipElement.style.display = 'none';
            });
        }

        this.TipElement.textContent = text;
        this.TipElement.style.display = 'block';
        
        this.tipTimeOut = setTimeout(() => {
            if (this.TipElement) {
                this.TipElement.style.display = 'none';
            }
        }, 2000);
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    static copy(text) {
        // 处理文本（替换非换行空格）
        text = String(text).replace(/\xA0/g, ' ');
        
        // 创建临时文本框
        const textarea = document.createElement('textarea');
        Object.assign(textarea.style, {
            position: 'absolute',
            left: '-9999px',
            top: '-9999px'
        });
        textarea.readOnly = true;
        textarea.value = text;

        // 添加到页面并选中内容
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);

        try {
            document.execCommand('copy');
        } catch (e) {
            console.warn('复制失败：', e);
        } finally {
            document.body.removeChild(textarea);
        }
    }

    /**
     * 获取元素选中文本
     * @param {HTMLElement} element - DOM元素
     * @returns {string} 选中的文本
     */
    static getElementSelectedText(element) {
        if (!(element instanceof HTMLElement)) {
            console.error('请传入有效的DOM元素');
            return '';
        }

        const selection = window.getSelection();
        const range = document.createRange();
        
        // 选中目标元素内的所有内容
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        
        const selectedText = selection.toString();
        selection.removeAllRanges();
        
        return selectedText;
    }

    /**
     * 恢复被禁用的console.log
     */
    static recConsoleLog() {
        if (window.console.log.toString().trim() === 'function(){}') {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            window.console.log = iframe.contentWindow.console.log;
            console.log('恢复log成功');
        }
    }

    /**
     * 加载外部脚本
     * @param {string} src - 脚本URL
     * @param {Function} [callback] - 加载成功回调
     */
    static loadScript(src, callback) {
        // 解析并清理URL（去除参数部分）
        const cleanUrl = (url) => {
            try {
                const parsedUrl = new URL(url);
                parsedUrl.search = '';
                return parsedUrl.toString();
            } catch (e) {
                const queryIndex = url.indexOf('?');
                return queryIndex > -1 ? url.slice(0, queryIndex) : url;
            }
        };

        const cleanedSrc = cleanUrl(src);

        // 检查脚本是否已存在
        const existingScripts = document.querySelectorAll('script[src]');
        for (const script of existingScripts) {
            if (script.src && cleanUrl(script.src) === cleanedSrc) {
                return;
            }
        }

        // 创建新脚本标签
        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        
        if (typeof callback === 'function') {
            script.onload = () => callback();
        }
        
        script.onerror = () => {
            console.error(`加载脚本失败: ${src}`);
        };

        document.head.appendChild(script);
    }

    /**
     * 加载URL弹窗
     */
    static loadUrl() {
        this.print(window.location.href, (url) => {
            if (url.trim() && window.location.href !== url) {
                window.location.href = url;
            }
        }, '请输入url：');
    }
}

class ExamProcessor {
    constructor() {
        this.examData = [];
    }

    /**
     * 解析当前页面的选择题和判断题
     */
    parseExam() {
        const questionContainers = document.querySelectorAll('.allAnswerList.questionWrap');
        if (questionContainers.length === 0) {
            console.log('未找到题目容器');
            return [];
        }

        this.examData = [];
        
        Array.from(questionContainers).forEach(container => {
            const questionId = container.getAttribute('data') || 'unknown_id';
            const typeInput = container.querySelector('input[name^="typeName"]');
            const questionType = typeInput ? typeInput.value : '未知题型';

            // 只处理选择题和判断题
            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                return;
            }

            // 提取题目内容
            let questionContent = '';
            const titleElem = container.querySelector('.tit');
            if (titleElem) {
                const contentElem = titleElem.querySelector('p') || titleElem;
                questionContent = contentElem.textContent.replace(/(\d+)\./, '').trim();
            }

            const question = {
                questionId,
                questionType,
                questionContent,
                options: [],
                selectedContents: []
            };

            this.parseChoiceQuestion(container, question);
            this.examData.push(question);
        });

        return this.examData;
    }

    /**
     * 解析选择题/判断题的选项
     */
    parseChoiceQuestion(container, question) {
        const optionElems = container.querySelectorAll('.answerList');
        
        optionElems.forEach(option => {
            const content = option.querySelector('.answerInfo')?.textContent.trim() || '';
            question.options.push(content);

            if (option.classList.contains('on')) {
                question.selectedContents.push(content);
            }
        });
    }

    /**
     * 导出JSON数据
     */
    exportJson() {
        this.parseExam();
        return JSON.stringify(this.examData);
    }

    /**
     * 导入JSON数据
     */
    importJson(jsonStr) {
        try {
            const importedData = JSON.parse(jsonStr);
            if (!Array.isArray(importedData)) {
                console.error('导入数据格式错误，应为数组');
                return;
            }

            const idToDataMap = new Map();
            importedData.forEach(item => {
                if (item.questionId) {
                    idToDataMap.set(item.questionId, item);
                }
            });

            const currentContainers = document.querySelectorAll('.allAnswerList.questionWrap');
            
            currentContainers.forEach(container => {
                const questionId = container.getAttribute('data');
                if (!questionId) return;

                const matchedItem = idToDataMap.get(questionId);
                if (!matchedItem) return;

                if (['单选题', '多选题', '判断题'].includes(matchedItem.questionType)) {
                    this.restoreChoiceAnswer(container, matchedItem);
                }
            });

            console.log('选择题/判断题答案恢复完成');
        } catch (e) {
            console.error('导入失败：', e);
        }
    }

    /**
     * 通过字符串导入答案
     */
    importAnswersByString(answerStr) {
        const answerList = answerStr.split(/\s+/).filter(answer => answer.trim() !== '');
        if (answerList.length === 0) {
            console.error('输入字符串格式错误，未找到有效选项');
            return;
        }

        const allContainers = document.querySelectorAll('.allAnswerList.questionWrap');
        if (allContainers.length === 0) {
            console.error('未找到题目容器');
            return;
        }

        let answerIndex = 0;
        
        Array.from(allContainers).forEach((container, containerIndex) => {
            const typeInput = container.querySelector('input[name^="typeName"]');
            const questionType = typeInput ? typeInput.value : '';

            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                console.log(`第${containerIndex + 1}题（${questionType}）不是选择/判断题，跳过`);
                return;
            }

            if (answerIndex >= answerList.length) {
                console.log(`选项已用完，剩余题目（从第${containerIndex + 1}题开始）未匹配`);
                return;
            }

            console.log(`为第${containerIndex + 1}题（${questionType}）匹配选项：${answerList[answerIndex]}`);
            
            const matchedItem = {
                selectedContents: this._parseAnswerToContents(container, answerList[answerIndex])
            };
            
            this.restoreChoiceAnswer(container, matchedItem);
            answerIndex++;
        });

        if (answerIndex < answerList.length) {
            console.warn(`尚有${answerList.length - answerIndex}个选项未匹配`);
        } else {
            console.log(`已完成所有${answerIndex}个选项的匹配`);
        }
    }

    /**
     * 将选项字符串转换为选项内容数组
     */
    _parseAnswerToContents(container, answerCode) {
        const contents = [];
        const optionElems = container.querySelectorAll('.answerList');
        
        optionElems.forEach((option, optIndex) => {
            const optionCode = String.fromCharCode(65 + optIndex);
            if (answerCode.includes(optionCode)) {
                const content = option.querySelector('.answerInfo')?.textContent.trim() || '';
                contents.push(content);
            }
        });

        return contents;
    }

    /**
     * 恢复选择题/判断题答案
     */
    restoreChoiceAnswer(container, matchedItem) {
        // 取消所有已选状态
        container.querySelectorAll('.answerList.on').forEach(option => {
            if (window.$) {
                $(option).trigger('tap');
            }
        });

        // 选中匹配的选项
        container.querySelectorAll('.answerList').forEach(option => {
            const optionContent = option.querySelector('.answerInfo')?.textContent.trim() || '';
            if (matchedItem.selectedContents.includes(optionContent)) {
                if (window.$) {
                    $(option).trigger('tap');
                }
            }
        });
    }
}

class InClassExerciseProcessor {
    constructor() {
        this.examData = [];
    }

    /**
     * 解析当前页面所有题目
     */
    parseExam() {
        this.examData = [];
        
        // 查找题目容器
        let questionContainers = document.querySelectorAll('.answer-item');
        if (questionContainers.length === 0) {
            const swipeTrack = document.querySelector('.van-swipe__track');
            if (swipeTrack) {
                questionContainers = swipeTrack.querySelectorAll('.quiz-item');
            }
        }

        if (questionContainers.length === 0) {
            console.log('未找到题目容器');
            return [];
        }

        // 遍历容器解析题目
        Array.from(questionContainers).forEach((container, index) => {
            const isAnswering = container.classList.contains('answer-item');
            const isAnswered = container.classList.contains('quiz-item');
            const questionType = this._getQuestionType(container, isAnswering);

            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                return;
            }

            const questionId = `exam_question_${index + 1}_${questionType}`;
            const question = {
                questionId,
                questionType,
                questionContent: this._getQuestionContent(container, isAnswering),
                options: this._getOptionValues(container, isAnswering),
                myAnswerValues: [],
                correctAnswerValues: []
            };

            if (isAnswering) {
                question.myAnswerValues = this._parseAnsweringValues(container);
            } else if (isAnswered) {
                const { myValues, correctValues } = this._parseAnsweredValues(container, question.options);
                question.myAnswerValues = myValues;
                question.correctAnswerValues = correctValues;
            }

            this.examData.push(question);
        });

        return this.examData;
    }

    /**
     * 通过字符串导入答案
     */
    importAnswersByString(answerStr) {
        const answerList = answerStr.split(/\s+/).filter(answer => answer.trim() !== '');
        if (answerList.length === 0) {
            console.error('输入字符串格式错误，未找到有效答案');
            return;
        }

        let questionContainers = document.querySelectorAll('.answer-item');
        if (questionContainers.length === 0) {
            const swipeTrack = document.querySelector('.van-swipe__track');
            if (swipeTrack) {
                questionContainers = swipeTrack.querySelectorAll('.quiz-item');
            }
        }

        if (questionContainers.length === 0) {
            console.error('未找到题目容器，无法导入答案');
            return;
        }

        let answerIndex = 0;
        
        Array.from(questionContainers).forEach((container, containerIndex) => {
            const isAnswering = container.classList.contains('answer-item');
            const questionType = this._getQuestionType(container, isAnswering);

            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                console.log(`第${containerIndex + 1}题（${questionType}）不是选择/判断题，跳过`);
                return;
            }

            if (answerIndex >= answerList.length) {
                console.log(`答案已用完，剩余题目（从第${containerIndex + 1}题开始）未匹配`);
                return;
            }

            const { options, codeToValueMap } = this._getOptionsWithCodeMap(container, isAnswering);
            if (options.length === 0) {
                console.log(`第${containerIndex + 1}题未找到有效选项，跳过`);
                return;
            }

            const currentAnswer = answerList[answerIndex];
            const targetValues = this._parseAnswerToValues(currentAnswer, options, codeToValueMap, questionType);

            if (targetValues.length > 0) {
                console.log(`为第${containerIndex + 1}题（${questionType}）匹配答案：${currentAnswer}`);
                this._restoreAnswerByValues(container, isAnswering, targetValues);
                answerIndex++;
            } else {
                console.log(`第${containerIndex + 1}题未找到与"${currentAnswer}"匹配的选项，跳过`);
            }
        });

        if (answerIndex < answerList.length) {
            console.warn(`尚有${answerList.length - answerIndex}个答案未匹配`);
        } else {
            console.log(`已完成所有${answerIndex}个答案的匹配`);
        }
    }

    /**
     * 提取选项及选项名映射
     */
    _getOptionsWithCodeMap(container, isAnswering) {
        const options = [];
        const codeToValueMap = new Map();
        const optionElems = container.querySelectorAll('.quiz-options .option-item');

        Array.from(optionElems).forEach((option, index) => {
            // 提取选项值
            let value = '';
            const contentBox = option.querySelector('.html-content-box');
            if (contentBox) {
                value = contentBox.textContent.trim();
            } else {
                const fullText = option.textContent.trim();
                value = fullText.replace(/^[A-Z]\./, '').trim();
            }
            
            if (value) {
                options.push(value);
            }

            // 提取选项名
            let code = '';
            if (isAnswering) {
                const codeElem = option.querySelector('.option-name');
                code = codeElem ? codeElem.textContent.trim() : '';
            } else {
                const fullText = option.textContent.trim();
                const codeMatch = fullText.match(/^([A-Z])\./);
                code = codeMatch ? codeMatch[1] : '';
            }

            // 自动补全选项名
            if (!code && index < 26) {
                code = String.fromCharCode('A'.charCodeAt(0) + index);
            }

            if (code && value) {
                codeToValueMap.set(code, value);
            }
        });

        return { options, codeToValueMap };
    }

    /**
     * 将答案字符串转换为选项值
     */
    _parseAnswerToValues(answer, options, codeToValueMap, questionType) {
        // 判断题特殊处理
        if (questionType === '判断题' && options.length === 2) {
            const [firstOpt, secondOpt] = options;
            const isTrue = firstOpt === '对' || secondOpt === '错' ? firstOpt : options[0];
            const isFalse = firstOpt === '错' || secondOpt === '对' ? firstOpt : options[1];

            if (['A', '对'].includes(answer)) return [isTrue];
            if (['B', '错'].includes(answer)) return [isFalse];
        }

        // 处理选项名
        const valueFromCode = [];
        for (const char of answer) {
            if (codeToValueMap.has(char)) {
                valueFromCode.push(codeToValueMap.get(char));
            }
        }
        
        if (valueFromCode.length > 0) {
            return valueFromCode;
        }

        // 处理选项值文本
        const answerParts = questionType === '多选题' ? answer.split(/\s+/) : [answer];
        const valueFromText = answerParts.filter(part => options.includes(part.trim()));
        
        if (valueFromText.length > 0) {
            return valueFromText;
        }

        return [];
    }

    /**
     * 提取题型
     */
    _getQuestionType(container, isAnswering) {
        const typeSelector = isAnswering ? '.answer-title .gray' : '.quiz-title .gray';
        const typeElem = container.querySelector(typeSelector);
        
        return typeElem ? typeElem.textContent.replace(/\[|\]/g, '').trim() : '未知题型';
    }

    /**
     * 提取题目内容
     */
    _getQuestionContent(container, isAnswering) {
        const contentSelector = isAnswering 
            ? '.answer-title .html-content-box p' 
            : '.quiz-title .html-content-box p';
        
        const contentElem = container.querySelector(contentSelector);
        return contentElem ? contentElem.textContent.trim() : '未知题目';
    }

    /**
     * 提取选项值列表
     */
    _getOptionValues(container, isAnswering) {
        const options = [];
        const optionElems = container.querySelectorAll('.quiz-options .option-item');

        Array.from(optionElems).forEach(option => {
            let value = '';
            const contentBox = option.querySelector('.html-content-box');
            
            if (contentBox) {
                value = contentBox.textContent.trim();
            } else {
                const fullText = option.textContent.trim();
                value = fullText.replace(/^[A-Z]\./, '').trim();
            }
            
            if (value) {
                options.push(value);
            }
        });

        return options;
    }

    /**
     * 解析答题中场景的答案值
     */
    _parseAnsweringValues(container) {
        const selectedValues = [];
        const selectedOptions = container.querySelectorAll('.quiz-options .option-item.active');

        Array.from(selectedOptions).forEach(option => {
            const contentBox = option.querySelector('.html-content-box');
            if (contentBox) {
                selectedValues.push(contentBox.textContent.trim());
            } else {
                const fullText = option.textContent.trim();
                selectedValues.push(fullText.replace(/^[A-Z]\./, '').trim());
            }
        });

        return selectedValues;
    }

    /**
     * 解析已答题场景的答案值
     */
    _parseAnsweredValues(container, options) {
        const myAnswerText = this._getAnswerText(container, '.quiz-answer .answer-title span');
        const correctAnswerText = this._getAnswerText(container, '.correct-answer .answer-title span');

        return {
            myValues: this._matchAnswerToValues(myAnswerText, options),
            correctValues: this._matchAnswerToValues(correctAnswerText, options)
        };
    }

    /**
     * 提取答案文本
     */
    _getAnswerText(container, selector) {
        const answerElem = container.querySelector(selector);
        if (!answerElem) return '';
        
        return answerElem.textContent.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '').trim();
    }

    /**
     * 将答案文本匹配为选项值
     */
    _matchAnswerToValues(answerText, options) {
        if (!answerText) return [];

        // 直接匹配选项值
        const exactMatch = options.filter(option => option === answerText);
        if (exactMatch.length > 0) return exactMatch;

        // 判断题特殊处理
        if (options.length === 2 && ['对', '错'].every(v => options.includes(v))) {
            if (answerText === 'A' || answerText === '对') return ['对'];
            if (answerText === 'B' || answerText === '错') return ['错'];
        }

        // 选项名转选项值
        const matchedValues = [];
        for (const char of answerText) {
            const index = char.charCodeAt(0) - 'A'.charCodeAt(0);
            if (index >= 0 && index < options.length) {
                matchedValues.push(options[index]);
            }
        }

        return matchedValues;
    }

    /**
     * 导出JSON数据
     */
    exportJson() {
        this.parseExam();
        return JSON.stringify(this.examData);
    }

    /**
     * 导入JSON数据
     */
    importJson(jsonStr) {
        try {
            const importedData = JSON.parse(jsonStr);
            if (!Array.isArray(importedData)) {
                console.error('导入数据格式错误，应为数组');
                return;
            }

            const idMap = new Map();
            importedData.forEach(item => {
                if (item.questionId) {
                    idMap.set(item.questionId, item);
                }
            });

            let questionContainers = document.querySelectorAll('.answer-item');
            if (questionContainers.length === 0) {
                const swipeTrack = document.querySelector('.van-swipe__track');
                if (swipeTrack) {
                    questionContainers = swipeTrack.querySelectorAll('.quiz-item');
                }
            }

            if (questionContainers.length === 0) {
                console.error('未找到题目容器，无法恢复答案');
                return;
            }

            Array.from(questionContainers).forEach((container, index) => {
                const isAnswering = container.classList.contains('answer-item');
                const questionType = this._getQuestionType(container, isAnswering);
                const questionId = `exam_question_${index + 1}_${questionType}`;
                const matchedData = idMap.get(questionId);

                if (!matchedData) return;

                const targetValues = matchedData.correctAnswerValues.length > 0
                    ? matchedData.correctAnswerValues
                    : matchedData.myAnswerValues;

                if (targetValues.length > 0) {
                    this._restoreAnswerByValues(container, isAnswering, targetValues);
                }
            });

            console.log('答案恢复完成');
        } catch (e) {
            console.error('导入失败：', e);
        }
    }

    /**
     * 通过选项值恢复答案
     */
    _restoreAnswerByValues(container, isAnswering, targetValues) {
        const optionElems = container.querySelectorAll('.quiz-options .option-item');

        // 取消所有已选中状态
        optionElems.forEach(option => {
            if (option.classList.contains('active')) {
                option.click();
            }
        });

        // 选中目标选项
        optionElems.forEach(option => {
            let optionValue = '';
            const contentBox = option.querySelector('.html-content-box');
            
            if (contentBox) {
                optionValue = contentBox.textContent.trim();
            } else {
                const fullText = option.textContent.trim();
                optionValue = fullText.replace(/^[A-Z]\./, '').trim();
            }

            if (targetValues.includes(optionValue)) {
                option.click();
            }
        });
    }
}

class HomeworkProcessor {
    constructor() {
        this.homeworkData = [];
    }

    /**
     * 解析当前页面作业题目
     */
    parseHomework() {
        this.homeworkData = [];
        
        const isAnswering = document.querySelector('.mark_table.padTop20.ans-cc') !== null;
        const isReviewed = document.querySelector('.mark_table.padTop60.ans-cc') !== null;

        let questionContainers = [];
        if (isAnswering || isReviewed) {
            questionContainers = document.querySelectorAll('.questionLi.singleQuesId');
        }

        if (questionContainers.length === 0) {
            console.log('未找到作业题目容器');
            return [];
        }

        Array.from(questionContainers).forEach((container, index) => {
            const questionType = this._getQuestionType(container, isAnswering);
            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                return;
            }

            const questionId = container.id || `homework_question_${index + 1}_${questionType}`;
            const question = {
                questionId,
                questionType,
                questionContent: this._getQuestionContent(container, isAnswering),
                options: this._getOptionValues(container, isAnswering),
                myAnswerValues: [],
                correctAnswerValues: []
            };

            if (isAnswering) {
                question.myAnswerValues = this._parseAnsweringValues(container, questionType);
            } else if (isReviewed) {
                const { myValues, correctValues } = this._parseReviewedValues(container, questionType, question.options);
                question.myAnswerValues = myValues;
                question.correctAnswerValues = correctValues;
            }

            this.homeworkData.push(question);
        });

        return this.homeworkData;
    }

    /**
     * 通过字符串导入答案
     */
    importAnswersByString(answerStr) {
        const answerList = answerStr.split(/\s+/).filter(answer => answer.trim() !== '');
        if (answerList.length === 0) {
            console.error('输入字符串格式错误，未找到有效答案');
            return;
        }

        const isAnswering = document.querySelector('.mark_table.padTop20.ans-cc') !== null;
        if (!isAnswering) {
            console.error('仅支持答题中场景导入答案');
            return;
        }

        const questionContainers = document.querySelectorAll('.questionLi.singleQuesId');
        if (questionContainers.length === 0) {
            console.error('未找到题目容器，无法导入答案');
            return;
        }

        let answerIndex = 0;
        
        Array.from(questionContainers).forEach((container, containerIndex) => {
            const questionType = this._getQuestionType(container, isAnswering);
            
            if (!['单选题', '多选题', '判断题'].includes(questionType)) {
                console.log(`第${containerIndex + 1}题（${questionType}）不是单选/多选/判断题，跳过`);
                return;
            }

            if (answerIndex >= answerList.length) {
                console.log(`答案已用完，剩余题目（从第${containerIndex + 1}题开始）未匹配`);
                return;
            }

            const { options, codeToValueMap } = this._getOptionsWithCodeMap(container, isAnswering);
            if (options.length === 0) {
                console.log(`第${containerIndex + 1}题未找到有效选项，跳过`);
                return;
            }

            const currentAnswer = answerList[answerIndex];
            const targetValues = this._parseAnswerToValues(currentAnswer, options, codeToValueMap, questionType);
            
            if (targetValues.length > 0) {
                console.log(`为第${containerIndex + 1}题（${questionType}）匹配答案：${currentAnswer}`);
                this._restoreAnswerByValues(container, questionType, targetValues);
                answerIndex++;
            } else {
                console.log(`第${containerIndex + 1}题未找到与"${currentAnswer}"匹配的选项，跳过`);
            }
        });

        if (answerIndex < answerList.length) {
            console.warn(`尚有${answerList.length - answerIndex}个答案未匹配`);
        } else {
            console.log(`已完成所有${answerIndex}个答案的匹配`);
        }
    }

    /**
     * 导出JSON数据
     */
    exportJson() {
        this.parseHomework();
        return JSON.stringify(this.homeworkData);
    }

    /**
     * 导入JSON数据
     */
    importJson(jsonStr) {
        try {
            const importedData = JSON.parse(jsonStr);
            if (!Array.isArray(importedData)) {
                console.error('导入数据格式错误，应为数组');
                return;
            }

            const isAnswering = document.querySelector('.mark_table.padTop20.ans-cc') !== null;
            if (!isAnswering) {
                console.error('仅支持答题中场景导入JSON答案');
                return;
            }

            const idMap = new Map();
            importedData.forEach(item => {
                if (item.questionId && ['单选题', '多选题', '判断题'].includes(item.questionType)) {
                    idMap.set(item.questionId, item);
                }
            });

            const questionContainers = document.querySelectorAll('.questionLi.singleQuesId');
            if (questionContainers.length === 0) {
                console.error('未找到题目容器，无法恢复答案');
                return;
            }

            Array.from(questionContainers).forEach(container => {
                const questionType = this._getQuestionType(container, isAnswering);
                const questionId = container.id || '';
                const matchedData = idMap.get(questionId);

                if (!matchedData || !['单选题', '多选题', '判断题'].includes(questionType)) {
                    return;
                }

                const targetValues = matchedData.correctAnswerValues.length > 0
                    ? matchedData.correctAnswerValues
                    : matchedData.myAnswerValues;

                if (targetValues.length > 0) {
                    this._restoreAnswerByValues(container, questionType, targetValues);
                }
            });

            console.log('答案恢复完成');
        } catch (e) {
            console.error('导入失败：', e);
        }
    }

    /**
     * 提取题型
     */
    _getQuestionType(container, isAnswering) {
        if (isAnswering) {
            return container.getAttribute('typename') || '未知题型';
        } else {
            const typeElem = container.querySelector('.mark_name .colorShallow');
            return typeElem ? typeElem.textContent.replace(/[()]/g, '').trim() : '未知题型';
        }
    }

    /**
     * 提取题目内容
     */
    _getQuestionContent(container, isAnswering) {
        if (isAnswering) {
            const contentElem = container.querySelector('.mark_name');
            if (contentElem) {
                return contentElem.textContent
                    .replace(/^\d+\./, '')
                    .replace(/\(.*?\)/, '')
                    .trim();
            }
        } else {
            const contentElem = container.querySelector('.qtContent');
            if (contentElem) {
                return contentElem.textContent.trim();
            }
        }
        return '未知题目';
    }

    /**
     * 提取选项值列表
     */
    _getOptionValues(container, isAnswering) {
        const options = [];
        
        if (isAnswering) {
            const optionElems = container.querySelectorAll('.answer_p');
            optionElems.forEach(elem => {
                const value = elem.textContent.trim();
                if (value) options.push(value);
            });
        } else {
            const optionElems = container.querySelectorAll('.qtDetail li');
            optionElems.forEach(elem => {
                const value = elem.textContent.replace(/^[A-Z]\./, '').trim();
                if (value) options.push(value);
            });
        }
        
        return options;
    }

    /**
     * 提取选项及选项名映射
     */
    _getOptionsWithCodeMap(container, isAnswering) {
        const options = [];
        const codeToValueMap = new Map();
        const optionCodes = ['A', 'B', 'C', 'D', 'E'];

        if (isAnswering) {
            const optionElems = container.querySelectorAll('.answerBg');
            
            Array.from(optionElems).forEach((elem, index) => {
                const contentElem = elem.querySelector('.answer_p');
                const value = contentElem ? contentElem.textContent.trim() : '';
                
                if (value) {
                    options.push(value);
                }

                const codeElem = elem.querySelector('.num_option, .num_option_dx');
                let code = codeElem ? codeElem.textContent.trim() : '';
                
                if (!code && index < optionCodes.length) {
                    code = optionCodes[index];
                }

                if (code && value) {
                    codeToValueMap.set(code, value);
                }
            });
        } else {
            const optionElems = container.querySelectorAll('.qtDetail li');
            
            Array.from(optionElems).forEach((elem, index) => {
                const fullText = elem.textContent.trim();
                const codeMatch = fullText.match(/^([A-Z])\./);
                let code = codeMatch ? codeMatch[1] : '';
                
                if (!code && index < optionCodes.length) {
                    code = optionCodes[index];
                }

                const value = fullText.replace(/^[A-Z]\./, '').trim();
                if (value) {
                    options.push(value);
                }

                if (code && value) {
                    codeToValueMap.set(code, value);
                }
            });
        }

        return { options, codeToValueMap };
    }

    /**
     * 将答案字符串转换为选项值列表
     */
    _parseAnswerToValues(answer, options, codeToValueMap, questionType) {
        // 判断题特殊处理
        if (questionType === '判断题' && options.length === 2) {
            const [trueOpt, falseOpt] = options;
            if (['A', '对', '正确'].includes(answer)) return [trueOpt];
            if (['B', '错', '错误'].includes(answer)) return [falseOpt];
        }

        // 处理选项名
        const valueFromCode = [];
        for (const char of answer) {
            if (codeToValueMap.has(char)) {
                valueFromCode.push(codeToValueMap.get(char));
            }
        }
        
        if (valueFromCode.length > 0) {
            return valueFromCode;
        }

        // 处理选项值文本
        const answerParts = questionType === '多选题' ? answer.split(/\s+/) : [answer];
        const valueFromText = answerParts.filter(part => options.includes(part.trim()));
        
        if (valueFromText.length > 0) {
            return valueFromText;
        }

        return [];
    }

    /**
     * 解析答题中场景的我的答案值
     */
    _parseAnsweringValues(container, questionType) {
        const myValues = [];
        const selectedElems = container.querySelectorAll('.check_answer, .check_answer_dx');

        selectedElems.forEach(elem => {
            const answerPElem = elem.closest('.answerBg')?.querySelector('.answer_p');
            if (answerPElem) {
                const value = answerPElem.textContent.trim();
                if (value) myValues.push(value);
            }
        });

        return myValues;
    }

    /**
     * 解析批阅后场景的答案值
     */
    _parseReviewedValues(container, questionType, options) {
        const result = { myValues: [], correctValues: [] };
        const { codeToValueMap } = this._getOptionsWithCodeMap(container, false);

        const myAnswerElem = container.querySelector('.stuAnswerContent');
        if (myAnswerElem) {
            const myAnswerText = myAnswerElem.textContent.trim();
            result.myValues = this._parseAnswerToValues(myAnswerText, options, codeToValueMap, questionType);
        }

        const correctAnswerElem = container.querySelector('.rightAnswerContent');
        if (correctAnswerElem) {
            const correctAnswerText = correctAnswerElem.textContent.trim();
            result.correctValues = this._parseAnswerToValues(correctAnswerText, options, codeToValueMap, questionType);
        }

        return result;
    }

    /**
     * 通过选项值恢复答案
     */
    _restoreAnswerByValues(container, questionType, targetValues) {
        // 取消所有已选中状态
        const selectedElems = container.querySelectorAll('.check_answer, .check_answer_dx');
        selectedElems.forEach(elem => {
            const parent = elem.closest('.answerBg');
            if (parent) parent.click();
        });

        // 选中目标选项
        const optionElems = container.querySelectorAll('.answerBg');
        for (const elem of optionElems) {
            const answerPElem = elem.querySelector('.answer_p');
            if (answerPElem) {
                const optionValue = answerPElem.textContent.trim();
                if (targetValues.includes(optionValue)) {
                    elem.click();
                    // 单选/判断选中一个后退出
                    if (['单选题', '判断题'].includes(questionType)) {
                        break;
                    }
                }
            }
        }
    }
}

class AdvancedWebTool {
    constructor() {
        this.url = new URL(window.location.href).pathname;
        console.log('当前页面路径:', this.url);
        
        // JS管理器
        this.jsManager = {
            getUrlKey: () => this.url,
            
            getStoredJS: () => {
                const key = this.jsManager.getUrlKey();
                return localStorage.getItem(key) || '';
            },
            
            editStoredJS: (jsCode) => {
                try {
                    const key = this.jsManager.getUrlKey();
                    localStorage.setItem(key, jsCode || '');
                    return true;
                } catch (error) {
                    console.error('保存JS代码失败:', error);
                    return false;
                }
            },
            
            executeStoredJS: () => {
                try {
                    const jsCode = this.jsManager.getStoredJS();
                    if (jsCode) {
                        eval(jsCode);
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error(`自动化出错:${error}\n请修复或移除js`);
                    return false;
                }
            },
            
            deleteStoredJS: () => {
                try {
                    const key = this.jsManager.getUrlKey();
                    const exists = localStorage.getItem(key) !== null;
                    localStorage.removeItem(key);
                    return exists;
                } catch (error) {
                    console.error('删除JS代码失败:', error);
                    return false;
                }
            }
        };
        
        // 地址管理器
        this.addressManager = {
            getKey: () => 'qcxs_address',
            
            getAllAddress: () => {
                const stored = localStorage.getItem(this.addressManager.getKey());
                return stored ? JSON.parse(stored) : [{ remark: '添加位置' }];
            },
            
            saveAddress: (address) => {
                localStorage.setItem(this.addressManager.getKey(), JSON.stringify(address));
            },
            
            addAddress: (record) => {
                if (!record || typeof record !== 'object' || !('name' in record)) {
                    ToolClass.showTip('添加的记录必须是包含 name 的对象');
                    return;
                }
                
                const address = this.addressManager.getAllAddress();
                address.unshift(record);
                this.addressManager.saveAddress(address);
            },
            
            deleteAddress: (index) => {
                const address = this.addressManager.getAllAddress();
                if (typeof index !== 'number' || index < 0 || index >= address.length) {
                    console.warn('无效的记录下标');
                    return false;
                }
                
                address.splice(index, 1);
                this.addressManager.saveAddress(address);
                return true;
            },
            
            getAddressMenuItems: (callback) => {
                if (typeof callback !== 'function') {
                    ToolClass.showTip('callback不是函数！');
                    return [];
                }
                
                const address = this.addressManager.getAllAddress();
                return address.map((record, index) => ({
                    name: this.addressManager.getshow(record),
                    callback: () => callback(index, record)
                }));
            },
            
            getshow: (record) => {
                return (record.remark || '').trim().length > 0 ? record.remark : record.name;
            }
        };
        
        this.processor = null;
        this.erudaVisible = null;
        this.menuItems = [];
        
        this.init();
    }

    /**
     * 初始化方法
     */
    init() {
        this.initJS();
        this.initMenuItems();
        this.executeDelayTask();
        this.deletePptactiveCache();
        this.jsManager.executeStoredJS();
        this.launchEvent();
        this.bindDblclickEvent();
    }

    /**
     * 初始化JS依赖
     */
    initJS() {
        // 加载jQuery
        if (!window.jQuery) {
            ToolClass.loadScript('https://mooc1-api.chaoxing.com/mooc-ans/js/set/phone/jquery-1.9.0.min.js', () => {
                console.log('启用jquery');
            });
        }
        
        // 加载JSBridge
        if (!window.jsBridge) {
            ToolClass.loadScript('https://mooc1-api.chaoxing.com/mooc-ans/js/phone/protocolChaoXing/CXJSBridge.js', () => {
                const iframe = document.createElement('iframe');
                iframe.src = 'jsbridge://NotificationReady';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                console.log('启用JSBridge');
            });
        }
        
        // 加载AppUtils
        if (!window.AppUtils) {
            ToolClass.loadScript('https://mooc1-api.chaoxing.com/mooc-ans/js/phone/app.utils.js', () => {
                console.log('启用AppUtils');
            });
        }
    }

    /**
     * 初始化菜单项
     */
    initMenuItems() {
        this.menuItems = [
            {
                name: "eruda",
                callback: () => {
                    if (window.eruda) {
                        this.erudaVisible = !this.erudaVisible;
                        this.erudaVisible ? eruda.init() : eruda.destroy();
                        return;
                    }
                    
                    ToolClass.loadScript('https://cdn.jsdelivr.net/npm/eruda', () => {
                        eruda.init();
                        this.erudaVisible = true;
                    });
                }
            },
            {
                name: "自动化",
                callback: () => {
                    const storedJS = this.jsManager.getStoredJS();
                    this.createInputDialog('当前网页启动时自动执行的js，为空删除', (code) => {
                        if (code.trim()) {
                            const success = this.jsManager.editStoredJS(code);
                            ToolClass.showTip(success ? '保存成功' : '保存失败');
                        } else {
                            const success = this.jsManager.deleteStoredJS();
                            ToolClass.showTip(success ? '成功删除记录' : '无记录可删除或删除失败');
                        }
                    }, storedJS);
                }
            },
            {
                name: "编辑网页",
                callback: () => {
                    document.body.contentEditable = document.body.isContentEditable ? "false" : "true";
                    ToolClass.showTip(document.body.isContentEditable ? '娱乐功能，勿做他用' : '关闭编辑');
                }
            },
            { 
                name: "刷新", 
                callback: () => window.location.reload() 
            },
            { 
                name: "加载url", 
                callback: () => ToolClass.loadUrl() 
            }
        ];

        // 根据页面类型加载对应的处理器
        if (this.url === '/exam-ans/exam/phone/preview') {
            this.processor = new ExamProcessor();
        } else if (
            this.url === '/pptTestPaperStu/startAnswer' || 
            this.url === '/widget/weixin/vote/stuVoteController/preVote' || 
            this.url === '/pptTestPaperStu/reStartAnswerV2'
        ) {
            this.processor = new InClassExerciseProcessor();
        } else if (
            this.url === '/mooc-ans/mooc2/work/dowork' || 
            this.url === '/mooc-ans/mooc2/work/view'
        ) {
            this.processor = new HomeworkProcessor();
        }

        // 添加处理器相关菜单项
        if (this.processor) {
            this.menuItems.unshift(
                { name: "导出题目", callback: () => this.outputExamAnswerByMe() },
                { name: "导入json", callback: () => this.inputExamAnswerForJson() },
                { name: "导入Str", callback: () => this.inputExamAnswerForStr() }
            );
        }
    }

    /**
     * 设置启动方式
     */
    launchEvent() {
        const itemChildren = [
            {
                menu: '菜单',
                option: 'this.showItemsMenu()'
            },
            {
                menu: '浏览器打开',
                option: `
                AppUtils.openUrl({
                    loadType: 2, 
                    webUrl: window.location.href
                });
                `
            },
            {
                menu: '网页文字',
                option: `ToolClass.print(ToolClass.getElementSelectedText(document.body))`
            },
            {
                menu: '加载url',
                option: `ToolClass.loadUrl()`
            },
            {
                menu: 'PC中心',
                option: `  
                AppUtils.openUrl({
                    loadType: 1, 
                    webUrl: 'https://mooc2-ans.chaoxing.com/mooc2-ans/visit/interaction'
                });
                `
            }
        ];

        // 特殊页面添加功能
        if (this.url === '/exam-ans/exam/test/reVersionTestStartNew') {
            itemChildren.push({
                menu: '切换考试端',
                option: `
                const url = new URL(window.location.href);
                const params = new URLSearchParams(window.location.search);
                if (params.get('isphone') !== 'true') {
                    url.searchParams.set('isphone', 'true');
                } else {
                    url.searchParams.delete('isphone');
                }
                window.location.href = url.href;
                `
            });
        } else if (this.url === '/pptTestPaperStu/startAnswer') {
            itemChildren.unshift({
                menu: '修改',
                option: `openReEdit()`
            });
        }

        // 等待AppUtils加载后设置菜单
        const menuSetup = setInterval(() => {
            if (window.AppUtils) {
                this.menuItems.push(
                    {
                        name: "个人信息",
                        callback: () => {
                            AppUtils.getUserInfo('cx_fanya', (userInfo) => {
                                ToolClass.print(userInfo);
                            });
                        }
                    },
                    {
                        name: "退出",
                        callback: () => {
                            if (window.jsBridge) {
                                jsBridge.postNotification('CLIENT_EXIT_LEVEL', { "level": 1 });
                            }
                        }
                    }
                );

                // 位置签到页面添加位置库选项
                if (
                    this.url === '/widget/weixin/sign/stuSignController/preSign' || 
                    this.url === '/newsign/preSign'
                ) {
                    itemChildren.push({
                        menu: '位置库',
                        option: `this.showAdressList()`
                    });
                }

                // 处理option字符串
                itemChildren.forEach(item => {
                    item.option = `(function() { ${item.option} })()`;
                    item.option = item.option.replace(/this/g, "window.AdvancedWebTool");
                });

                // 设置菜单
                AppUtils.customMenu({
                    menu: '高级',
                    children: itemChildren
                });

                // 去除更新检测
                AppUtils.isNewVersionNew = () => true;
                AppUtils.isNewVersion = () => true;
                AppUtils.isChaoXingStudy = () => true;

                // 适配旧版本
                if (window.checkClientSignatureSupport) {
                    try {
                        checkClientSignatureSupport = () => false;
                    } catch (error) {
                        console.log('适配旧版本失败:', error);
                    }
                }

                clearInterval(menuSetup);
            }
        }, 1000);
    }

    /**
     * 显示位置列表
     */
    showAdressList() {
        const menuItems = this.addressManager.getAddressMenuItems((index, address) => {
            if (address.remark === '添加位置') {
                try {
                    const newAddress = {
                        name: $("#paramAddress").val() || $('#address').text() || '地址(教师端显示)',
                        latitude: $("#latitude").val() || '纬度(数字)',
                        longitude: $("#longitude").val() || '经度(数字)',
                        remark: ''
                    };
                    
                    this.createInputDialog('确认添加此位置？', (text) => {
                        try {
                            const parsed = JSON.parse(text);
                            this.addressManager.addAddress(parsed);
                        } catch (e) {
                            ToolClass.showTip('格式错误，请输入有效的JSON');
                        }
                    }, JSON.stringify(newAddress, null, 2));
                } catch (e) {
                    ToolClass.print('发生错误: ' + e);
                }
                return;
            }

            // 位置操作菜单
            const menu = [
                {
                    name: '签到',
                    callback: () => {
                        try {
                            $("#paramAddress").val(address.name);
                            $("#latitude").val(address.latitude);
                            $("#longitude").val(address.longitude);
                            
                            if (typeof window.sign === 'function') {
                                window.sign();
                            }
                        } catch (e) {
                            ToolClass.print('发生错误：' + e);
                        }
                    }
                },
                {
                    name: '备注',
                    callback: () => {
                        this.createInputDialog('请输入备注', (remark) => {
                            this.addressManager.deleteAddress(index);
                            address.remark = remark;
                            this.addressManager.addAddress(address);
                        }, address.remark);
                    }
                },
                {
                    name: '编辑',
                    callback: () => {
                        this.createInputDialog('编辑位置', (text) => {
                            try {
                                const parsed = JSON.parse(text);
                                this.addressManager.deleteAddress(index);
                                this.addressManager.addAddress(parsed);
                            } catch (e) {
                                ToolClass.showTip('格式错误，请输入有效的JSON');
                            }
                        }, JSON.stringify(address, null, 2));
                    }
                },
                {
                    name: '删除',
                    callback: () => {
                        this.addressManager.deleteAddress(index);
                    }
                }
            ];
            
            this.createSelectDialog(menu, this.addressManager.getshow(address));
        });
        
        this.createSelectDialog(menuItems, '位置库：');
    }

    /**
     * 绑定双击事件
     */
    bindDblclickEvent() {
        document.addEventListener("dblclick", (e) => {
            ToolClass.showTip('菜单');
        });
    }

    /**
     * 显示功能菜单弹窗
     */
    showItemsMenu() {
        this.createSelectDialog(this.menuItems, "高级功能");
    }

    /**
     * 导出题目答案
     */
    outputExamAnswerByMe() {
        if (this.processor) {
            ToolClass.print(this.processor.exportJson());
        }
    }

    /**
     * 导入JSON答案
     */
    inputExamAnswerForJson() {
        this.createInputDialog('请输入分享的json：', (json) => {
            if (json.trim() && this.processor) {
                this.processor.importJson(json);
            } else {
                ToolClass.showTip('不能为空');
            }
        });
    }

    /**
     * 导入字符串答案
     */
    inputExamAnswerForStr() {
        this.createInputDialog('请输入AI回答的以空格连接的答案：', (str) => {
            if (str.trim() && this.processor) {
                this.processor.importAnswersByString(str);
            } else {
                ToolClass.showTip('不能为空');
            }
        });
        
        // 提供AI提示
        ToolClass.print(`${ToolClass.getElementSelectedText(document.body)}
请基于提供的全部题目内容，仅针对其中的选择题（含单选、多选）和判断题进行作答，完全忽略简答题、论述题等其他题型。具体要求如下：
识别题目类型：准确区分单选（唯一答案）、多选（多个答案）、判断（需明确 "对" 或 "错" 对应的选项，如题目要求判断后选 A/B 对应对 / 错，则返回 A 或 B）。
答案格式：
单选题答案直接返回选项（如 A、B）；
多选题答案用大写字母拼接（如 BC、ACD）；
判断题返回题目指定的 "对" 或 "错" 对应的选项（如题目标注 "对选 A，错选 B" 则返回 A 或 B）。
排序与分隔：按题目在内容中出现的原始顺序排列答案，不同题目答案之间用单个空格分隔，不添加任何额外字符、标点或说明。
请严格遵循上述规则，仅输出整理后的答案字符串。`);
    }

    /**
     * 创建输入弹窗
     */
    createInputDialog(title, callback, value = '') {
        ToolClass.print(value, callback, title);
    }

    /**
     * 创建选择弹窗
     */
    createSelectDialog(options, title = "请选择") {
        // 移除现有同层级弹窗
        this.removeExistingDialogs(1234);

        const dialogId = `sd-${Date.now()}`;
        const container = document.createElement('div');

        container.innerHTML = `
        <div class="mask" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:1234;">
            <div class="dialog" style="text-align:-webkit-auto;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;border:1px solid #ccc;border-radius:4px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15);padding:0;display:block;z-index:9996;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #eee;">
                    <span>${title}</span>
                    <button class="close-dialog" style="background:none;border:none;font-size:16px;cursor:pointer;padding:0;line-height:1;">×</button>
                </div>
                <div style="max-height:200px;overflow-y:auto;padding:8px 0;scrollbar-width:thin;">
                    <ul style="list-style:none;margin:0;padding:0;">
                        ${options.map((opt, i) => `
                            <li data-i="${i}" style="padding:8px 16px;cursor:pointer;">
                                <input type="radio" name="${dialogId}" id="${dialogId}-${i}" value="${i}" style="margin-right:8px;">
                                <label for="${dialogId}-${i}">${opt.name}</label>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:8px;padding:8px 16px;border-top:1px solid #eee;">
                    <button class="cancel-btn" style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#fff;border:1px solid #ccc;">取消</button>
                    <button class="okay-btn" style="padding:6px 16px;border-radius:4px;cursor:pointer;background:#409eff;color:#fff;border:none;">确定</button>
                </div>
            </div>
        </div>`;

        document.body.appendChild(container);

        // 默认选中第一个选项
        const firstInput = container.querySelector('input[type="radio"]');
        if (firstInput) {
            firstInput.checked = true;
            firstInput.closest('li').style.background = '#e6f3ff';
        }

        // 阻止弹窗内部点击冒泡
        const dialog = container.querySelector('.dialog');
        dialog.addEventListener('click', (e) => e.stopPropagation());

        // 关闭弹窗
        const closeDialog = () => container.remove();
        
        container.querySelector('.mask').onclick = closeDialog;
        container.querySelector('.close-dialog').onclick = closeDialog;
        container.querySelector('.cancel-btn').onclick = closeDialog;

        // 绑定确定按钮事件
        container.querySelector('.okay-btn').addEventListener('click', () => {
            const selectedIndex = container.querySelector('input:checked')?.value;
            if (selectedIndex !== undefined) {
                const selectedOption = options[selectedIndex];
                if (typeof selectedOption.callback === 'function') {
                    selectedOption.callback();
                }
            }
            closeDialog();
        });

        // 选项点击事件
        container.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                container.querySelectorAll('li').forEach(item => {
                    item.style.background = '';
                });
                li.style.background = '#e6f3ff';
                li.querySelector('input').checked = true;
            });
        });
    }

    /**
     * 执行延迟任务
     */
    executeDelayTask() {
        setTimeout(() => {
            try {
                this.enableCopyAndHideWatermark();
                this.enableEditorPaste();
                ToolClass.recConsoleLog();
            } catch (e) {
                console.error('延迟任务执行失败:', e);
            }
        }, 500);
    }

    /**
     * 允许复制、隐藏水印
     */
    enableCopyAndHideWatermark() {
        if (document.querySelector('.qcxsStyle')) return;

        const qcxsStyle = document.createElement('style');
        qcxsStyle.className = 'qcxsStyle';
        qcxsStyle.textContent = `
            * {
                -webkit-touch-callout: default !important;
                -webkit-user-select: text !important;
                -khtml-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
            .mask_div { display: none !important; }
        `;
        
        document.head.appendChild(qcxsStyle);

        // 移除PC端选择限制
        document.body.removeAttribute("onselectstart");
        document.documentElement.style.userSelect = "unset";
    }

    /**
     * 允许编辑器粘贴
     */
    enableEditorPaste() {
        // 处理自定义编辑器
        if (window.editors && Array.isArray(window.editors)) {
            window.editors.forEach(editor => {
                if (editor && editor.ueditor) {
                    editor.ueditor.__allListeners.beforepaste = null;
                }
            });
        }
        
        // 单个填空
        if (window.editor && window.editor.ueditor) {
            window.editor.ueditor.__allListeners.beforepaste = null;
        }
        
        // 处理UE编辑器
        if (window.UE && window.UE.instants && typeof window.UE.instants === "object") {
            Object.values(window.UE.instants).forEach(instance => {
                try {
                    if (instance.options) {
                        instance.options.disablePasteImage = false;
                    }
                    if (instance.removeListener) {
                        instance.removeListener("beforepaste", window.editorPaste);
                    }
                } catch (error) {
                    console.error("编辑器粘贴配置失败：", error);
                }
            });
        }
    }

    /**
     * 移除现有同层级弹窗
     */
    removeExistingDialogs(zIndex) {
        const existingMasks = document.querySelectorAll(`[style*="z-index:${zIndex}"]`);
        existingMasks.forEach(mask => mask.remove());
    }

    /**
     * 去除签到记录缓存
     */
    deletePptactiveCache() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('pptactive')) {
                console.log(`已删除签到记录缓存：${key}`);
                localStorage.removeItem(key);
            }
        });
    }
}

// 实例化并挂载到window
if (!window.AdvancedWebTool) {
    window.AdvancedWebTool = new AdvancedWebTool();
}