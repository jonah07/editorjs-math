/**
 * Build styles
 */
const katex = require("katex");

/**
 * Math Block for the Editor.js.
 * Render Tex syntax/plain text to pretty math equations
 *
 * @author flaming-cl
 * @license The MIT License (MIT)
 */

/**
 * @typedef {Object} MathData
 * @description Tool's input and output data format
 * @property {String} text — Math's content. Can include HTML tags: <a><b><i>
 */
class MathTex {
  /**
   * Default placeholder for Math Tool
   *
   * @return {string}
   * @constructor
   */
  static get DEFAULT_PLACEHOLDER() {
    return '';
  }

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: MathData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api, readOnly}) {
    this.api = api;
    this.readOnly = readOnly;

    this._CSS = {
      block: this.api.styles.block,
      wrapper: 'ce-Math',
      showClick: 'show-click',
    };
    this.onKeyUp = this.onKeyUp.bind(this);

    this._placeholder = config.placeholder ? config.placeholder : MathTex.DEFAULT_PLACEHOLDER;
    this._data = {};
    this._element = this.drawView();

    this.config = {
      fleqn: true,
      output: 'html',
      delimiter: '$$',
      throwOnError: true,
      displayMode: true,
    };

    this.data = data;
  }

  /**
   * Check if text content is empty and set empty string to inner html.
   * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
   *
   * @param {KeyboardEvent} e - key up event
   */
  onKeyUp(e) {
    const { textContent } = this._element;

    this.renderKatex();

    if (e.code !== 'Backspace' && e.code !== 'Delete') {
      return;
    }

    if (textContent === '') {
      this._element.innerHTML = '';
    }
  }

  /**
   * Change block editing state - rendering Katex or being editable
   */
  onClick(e) {
    if (!this.textNode || !this.katexNode || e.target === this.textNode) return;

    this.textNode.hidden = !(this.textNode.hidden);

    const inputError = this.katexNode.innerText.indexOf('ParseError') > -1;
    if (this.textNode.hidden == true && inputError) {
      katex.render(this.textBeforeError, this.katexNode, this.config);
    }
  }

  /**
   * switch the block to editable mode
   */
  enableEditing() {
    if (this.textNode) {
      return this.textNode.hidden = false;
    }

    this.textNode = document.createElement('input');
    this.textNode.placeholder = "Gleichung";
    this.textNode.contentEditable = true;
    this.textNode.value = this.data.text;
    this.textNode.hidden = true;
    this.textNode.className = 'text-node';
    this._element.appendChild(this.textNode);
  }

  /**
   * Create Tool's view
   * @return {HTMLElement}
   * @private
   */
  drawView() {
    const div = document.createElement('DIV');

    div.classList.add(this._CSS.wrapper, this._CSS.block);
    div.contentEditable = true;
    div.dataset.placeholder = this._placeholder;
    this.katexNode = document.createElement('div');
    this.katexNode.id = 'katex-node';
    this.katexNode.contentEditable = false;
    div.appendChild(this.katexNode);

    div.addEventListener('keyup', this.onKeyUp);
    return div;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   * @public
   */
  render() {
    this.renderKatex();
    if (!this.readOnly) {
      this.enableEditing();
      this._element.classList.add(this._CSS.showClick);
    }
    this._element.addEventListener('click', (e) => this.onClick(e));
    return this._element;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   */
  renderKatex() {
    this.data.text = this.textNode ? this.textNode.value : this.data.text;
    this.textToKatex();
  }

  /**
   * parsing the current text to Tex syntax if it has not been transformed
   */
  textToKatex() {
    /*if (!this.data.text) {
      this.data.text = 'Gleichung:';
    }*/

    if (!this.katexNode) return;

    if (this._element.innerText.indexOf('ParseError') < 0) {
      this.textBeforeError = this._element.innerText;
    }

    try {
      katex.render(this.data.text, this.katexNode, this.config);
    } catch (e) {
      const errorMsg = 'Ungültiger Ausdruck. ' + e.toString();
      this.katexNode.innerText = errorMsg;
    }
  }

  /**
   * content inside Math is unchangeable.
   * @param {MathData} data
   * @public
   */
  merge(data) {
    this.data = this.data;
  }

  /**
   * Validate Math block data:
   * - check for emptiness
   *
   * @param {MathData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    if (savedData.text.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * content inside Math is unchangeable
   * @param {HTMLDivElement} toolsContent - Math tools rendered view
   * @returns {MathData} - saved data
   * @public
   */
  save(toolsContent) {
    return {
      text: this.data.text
    };
  }

  /**
   * On paste callback fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    const data = {
      text: event.detail.data.innerHTML
    };

    this.data = data;
  }

  /**
   * Enable Conversion Toolbar. Math can be converted to/from other tools
   */
  static get conversionConfig() {
    return {
      export: 'text', // to convert Math to other block, use 'text' property of saved data
      import: 'text' // to covert other block's exported string to Math, fill 'text' property of tool data
    };
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      text: {
        br: true,
        svg: true
      }
    };
  }

  /**
   * Get current Tools`s data
   * @returns {MathData} Current data
   * @private
   */
  get data() {
    return this._data;
  }

  /**
   * Store data in plugin:
   * - at the this._data property
   * - at the HTML
   *
   * @param {MathData} data — data to set
   * @private
   */
  set data(data) {
    this._data = data || {};

    this.katexNode.innerHTML = this._data.text || '';
  }

  /**
   * Used by Editor paste handling API.
   * Provides configuration to handle P tags.
   *
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: [ 'P' ]
    };
  }

  /**
   * Icon and title for displaying at the Toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: '<?xml version="1.0" encoding="iso-8859-1"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg version="1.1" id="fxicon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 142.514 142.514" style="enable-background:new 0 0 142.514 142.514;" xml:space="preserve"><g><g><path d="M34.367,142.514c11.645,0,17.827-10.4,19.645-16.544c0.029-0.097,0.056-0.196,0.081-0.297c4.236-17.545,10.984-45.353,15.983-65.58h17.886c3.363,0,6.09-2.726,6.09-6.09c0-3.364-2.727-6.09-6.09-6.09H73.103c1.6-6.373,2.771-10.912,3.232-12.461l0.512-1.734c1.888-6.443,6.309-21.535,13.146-21.535c6.34,0,7.285,9.764,7.328,10.236c0.27,3.343,3.186,5.868,6.537,5.579c3.354-0.256,5.864-3.187,5.605-6.539C108.894,14.036,104.087,0,89.991,0C74.03,0,68.038,20.458,65.159,30.292l-0.49,1.659c-0.585,1.946-2.12,7.942-4.122,15.962H39.239c-3.364,0-6.09,2.726-6.09,6.09c0,3.364,2.726,6.09,6.09,6.09H57.53c-6.253,25.362-14.334,58.815-15.223,62.498c-0.332,0.965-2.829,7.742-7.937,7.742c-7.8,0-11.177-10.948-11.204-11.03c-0.936-3.229-4.305-5.098-7.544-4.156c-3.23,0.937-5.092,4.314-4.156,7.545C13.597,130.053,20.816,142.514,34.367,142.514z"/><path d="M124.685,126.809c3.589,0,6.605-2.549,6.605-6.607c0-1.885-0.754-3.586-2.359-5.474l-12.646-14.534l12.271-14.346c1.132-1.416,1.98-2.926,1.98-4.908c0-3.59-2.927-6.231-6.703-6.231c-2.547,0-4.527,1.604-6.229,3.684l-9.531,12.454L98.73,78.391c-1.89-2.357-3.869-3.682-6.7-3.682c-3.59,0-6.607,2.551-6.607,6.609c0,1.885,0.756,3.586,2.357,5.471l11.799,13.592L86.647,115.67c-1.227,1.416-1.98,2.926-1.98,4.908c0,3.589,2.926,6.229,6.699,6.229c2.549,0,4.53-1.604,6.229-3.682l10.19-13.4l10.193,13.4C119.872,125.488,121.854,126.809,124.685,126.809z"/></g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>',
      title: 'MathTex'
    };
  }
}

module.exports = MathTex;
