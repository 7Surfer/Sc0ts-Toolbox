// ==UserScript==
// @name         Sc0ts Toolbox
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Tools for pr0game
// @author       Sc0t
// @match        https://www.pr0game.com/uni*
// @match        https://pr0game.com/uni*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pr0game.com
// @updateURL    https://github.com/7Surfer/Sc0ts-Toolbox/raw/main/Sc0tsToolbox.user.js
// @downloadURL  https://github.com/7Surfer/Sc0ts-Toolbox/raw/main/Sc0tsToolbox.user.js
// @grant        none
// ==/UserScript==


/* Random Notes
    - Add config for uni settings (on each module?) (global, current uni)
*/

(function() {
    'use strict';
    const idPrefix = 'ST_';

    // Used Language dependend Texts
    const settingsText = ['Einstellungen', 'Ayarlar', 'Opções', 'Opcje', 'Einschdellungen', 'Настройки', 'Options', 'Configuración']

    //General
    /**
        Singleton
    */
    class Page {

        constructor() {
            //Singelton Implementation
            if (Page._instance) {
                return Page._instance
            }
            Page._instance = this;
            

            this.settings = new Settings()
            
            //Create and Append Settings menu entry
            this._createSettingsPage()
        }

        _createSettingsPage(){
            let menuOptions = Array.from(document.getElementById("menu").children)
            const settingsNode = menuOptions.filter(el => {return (el.children.length > 0 && settingsText.includes(el.firstChild.innerHTML))})[0]
            let menuNode = document.createElement("li");
            let aNode = document.createElement('a');
            aNode.appendChild(document.createTextNode("Sc0ts Toolbox"));
            aNode.title = "Sc0ts Toolbox";
            aNode.onclick = this.settings.show.bind(this.settings);
            aNode.style = "cursor: pointer";
            menuNode.appendChild(aNode);
            settingsNode.parentNode.insertBefore(menuNode, settingsNode);
        }

        getPage(){
            const currentPage = window.location.search.split("=")[1].toLowerCase().split("&")[0].toLowerCase()
            console.log(currentPage)
            return currentPage
        }

        getCurrentPlanet(){
            if (this.currentPlanet){
                return this.currentPlanet;
            }
            this.currentPlanet = document.getElementById("planetSelector").value;
            return this.currentPlanet;
        }
    }

    /**
        Singleton
    */
    class Settings {
        //Available settings options
        static valueOptions = {
            Checkbox: "checkbox",
            Select: "select",
        }

        //some example of how a settings config can look like
        static settingsConfig = {
            Checkbox : {
                checked: false,
            },
            Select: {
                options: [
                    {value: "key1", text:"text1"},
                    {value: "key2", text:"text2"},
                ],
                default: "key1"
            }
        }

        constructor() {
            //Singelton Implementation
            if (Settings._instance) {
                return Settings._instance
            }
            Settings._instance = this;
            this.prefix = "ST_";
            this.uni = window.location.pathname.split("/")[1] + "_";
        }

        setModules(modules){
            this.modules = modules
        }

        show() {
            //Remove current Content
            const myNode = document.getElementsByTagName("content")[0];
            while (myNode.firstChild) {
                myNode.removeChild(myNode.lastChild);
            }

            //Create and Show settings
            this._createSettingsTable();
            this._createModuleSettings();
        }

        _createSettingsTable(){
            const settingsTable = document.createElement('table');
            const settingsBody = document.createElement('tbody');
            settingsBody.id = idPrefix + "settingsBody";
            settingsTable.appendChild(settingsBody);
            document.getElementsByTagName("content")[0].style.maxWidth = "950px";
            document.getElementsByTagName("content")[0].appendChild(settingsTable)
        }

        _createModuleSettings(){
            const settingsBody = document.getElementById(idPrefix + "settingsBody");
            this.modules.forEach(module => {
                const modulSettings = module.getSettings();
                this._insertModulSettings(settingsBody, modulSettings);
            });
        }

        _insertModulSettings(settingsBody, modulSettings){
            const moduleId = modulSettings.get("id");

            for (const [settingsLabel, settingsValue] of modulSettings.entries()) {
                const settingKey = moduleId + "_" + settingsLabel;

                // ID is used as uniq PRefix for the modules settings
                if (settingsLabel === 'id') {
                    continue;
                }

                if (settingsLabel === 'label') {
                    this._insertModulSettingsHeadderNode(settingsBody, settingsValue)
                }else{
                    const settingsRow = document.createElement('tr');
                    const label = document.createElement('td');
                    label.width = "50%"
                    label.innerHTML= settingsLabel;
                    const setting = document.createElement('td');
                    setting.width = "50%"

                    switch (settingsValue.type) {
                        case Settings.valueOptions.Checkbox:
                            setting.appendChild(this._getCheckbox(settingKey, settingsValue.config));
                            break;
                        case Settings.valueOptions.Select:
                            setting.appendChild(this._getSelect(settingKey, settingsValue.config));
                            break;
                    
                        default:
                            console.log("Something went wrong. Please contact Sc0t")
                            break;
                    }
                    settingsRow.append(label, setting);
                    settingsBody.append(settingsRow);
                }
            }
        }

        _getCheckbox(settingKey, settingsConfig){
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            
            checkbox.addEventListener("change", function() {
                this.save(settingKey, checkbox.checked);
            }.bind(this));
            
            let savedState = this.load(settingKey)
            if (savedState){
                checkbox.checked = savedState === 'true';
            }
            else{
                checkbox.checked = settingsConfig.checked;
            }

            return checkbox
        }

        _getSelect(settingKey, settingsConfig){
            const selectList = document.createElement('select');
            
            selectList.addEventListener("change", function() {
                this.save(settingKey, selectList.value);
            }.bind(this));

            settingsConfig.options.forEach(definedOption => {
                var option = document.createElement("option");
                option.value = definedOption.value;
                option.text = definedOption.text;
                selectList.appendChild(option);
            });

            let savedState = this.load(settingKey)
            if (savedState){
                selectList.value = savedState
            }
            else{
                selectList.value = settingsConfig.default;
            }

            return selectList
        }

        save(setting, value){
            localStorage.setItem(this.prefix + this.uni + setting, value);
        }
        
        load(setting){
            return localStorage.getItem(this.prefix + this.uni + setting)
        }

        _insertModulSettingsHeadderNode(settingsBody, label){
            const headderRow = document.createElement('tr');
            const headderText = document.createElement('th');
            headderText.colSpan = 2;
            headderText.innerHTML = label;

            headderRow.appendChild(headderText);
            settingsBody.appendChild(headderRow);
        }
        
    }

    //Modules
    /**
     * Abstract Base Class
     */
    class Module {
        constructor(moduleId, moduleName) {
            //Force abstrt
            if (new.target === Module) {
                throw new TypeError("Cannot construct Abstract instances directly");
            }

            this.moduleId = moduleId;
            this.settings = new Settings()
            this.page = new Page();


            this.settingConfig = new Map();
            this.settingConfig.set('id', this.moduleId);
            this.settingConfig.set('label', moduleName);

            this.settingConfig.set('Aktiviert', {
                type: Settings.valueOptions.Checkbox, 
                config: {
                    checked: false
                }
            });
           
            this._extendSettings()
        }

        getSettings(){
            return this.settingConfig
        }

        _extendSettings(){
            throw new TypeError("extendSettings is required at Child Class");
        }

        _save(key,value){
            this.settings.save(this.moduleId + "_" + key, value)
        }

        _load(key){
            return this.settings.load(this.moduleId + "_" + key)
        }

        run(){
            throw new TypeError("run is required at Child Class");
        }
    }

    class PlanetShortcut extends Module{
        constructor() {
            super("PS", "Planeten Shortcuts")
        }

        _extendSettings(){
        }

        _getShortcutCustomId(shortcut){
            const name = shortcut.children[1].firstElementChild.value;
            const gal= shortcut.children[2].children[0].value;
            const sys = shortcut.children[2].children[1].value;
            const pos = shortcut.children[2].children[2].value;
            const type = shortcut.children[2].children[3].value;

            return `${name}_${gal}_${sys}_${pos}_${type}`
        }

        _addEventListenerToSave(shortcutSettings){
            const tath = this;
            const currentPlanet = this.page.getCurrentPlanet();
            document.getElementsByClassName("shortcut")[0].getElementsByClassName("shortcut-edit")[0].addEventListener("click", function() {
                for (const shortcut of document.getElementsByClassName("shortcut")[0].getElementsByClassName("shortcut-isset")) {
                    
                    const shortcutKey = tath._getShortcutCustomId(shortcut)
                    if (shortcut.lastElementChild.lastElementChild.getElementsByTagName("input")[0].checked){
                        shortcutSettings[shortcutKey] = currentPlanet;
                    }
                    else{
                        delete shortcutSettings[shortcutKey];
                    }

                    //update shortcut Settings
                    tath._save("settings", JSON.stringify(shortcutSettings))
                }
            })
        }

        _createEditCheckbox(referenceNode){
            //Add Input to edit
            const container = document.createElement('div');;
            const label = document.createElement('span');
            label.innerHTML="Planet spezifisch";
            label.style.padding = "10px"
            const checkbox = document.createElement('input');
            checkbox.type="checkbox";
            checkbox.name = "shortcut[][planetSpecific]";
                                
            //Add additional settings to View
            container.append(label,checkbox)
            referenceNode.parentNode.insertBefore(container, referenceNode.nextSibling);
            
            return checkbox;
        }

        _updateShortcut(shortcut, shortcutSettings, shortcutsToRemove, checkbox){
            const currentPlanet = this.page.getCurrentPlanet();
            let shortcutKey = undefined;
            if (shortcut.className.includes("isset")){
                shortcutKey = this._getShortcutCustomId(shortcut)
            }
            if (shortcutKey in shortcutSettings) {
                const shortcutPlanet = shortcutSettings[shortcutKey]
                
                checkbox.checked = shortcutPlanet === currentPlanet;
                
                //remove planet based shortcut for other planet
                if (shortcutPlanet !== currentPlanet){
                    shortcutsToRemove.push(shortcut)
                }
            }
        }

        run(){
            let enabled = this._load("Aktiviert") || 'false';
            if (enabled === 'false') {
                return;
            }
            //load Current Settings
            let shortcutSettings = JSON.parse(this._load("settings")) || {};

            this._addEventListenerToSave(shortcutSettings);

            //Create Checkbox to edit
            let shortcutsToRemove = [];
            for (const shortcut of document.getElementsByClassName("shortcut")[0].querySelectorAll(".shortcut-isset,.shortcut-new")) {
                const typeSelect = shortcut.getElementsByTagName("select")[0]
                if(typeSelect){
                    //create and Insert HTML, returns Checbox to modify state
                    let checkbox = this._createEditCheckbox(typeSelect)

                    //update Shortcut Checkbox and Remove Shortcut if planet based on different planet
                    this._updateShortcut(shortcut, shortcutSettings, shortcutsToRemove, checkbox)
                }
            }
        
            shortcutsToRemove.forEach(shortcut => {
                shortcut.parentElement.removeChild(shortcut)
            });
        }
    }

    class Notes extends Module{
        constructor() {
            super("N", "Notizen")
        }

        _extendSettings(){
            this.settingConfig.set('Übersichts Notizen', {
                type: Settings.valueOptions.Select, 
                config: {
                    options: [
                        {value: "disabled", text:"Deaktiviert"},
                        {value: 0, text:"Postion 1"},
                        {value: 1, text:"Postion 2"},
                        {value: 2, text:"Postion 3"},
                        {value: 3, text:"Postion 4"},
                        {value: 4, text:"Postion 5"},
                    ],
                    default: "disabled"
                }
            });

            this.settingConfig.set('Übersichts Notizen Gültigkeitsbereich', {
                type: Settings.valueOptions.Select, 
                config: {
                    options: [
                        {value: "global", text:"Global"},
                        {value: "planet", text:"Planet"},
                    ],
                    default: "global"
                }
            });
        }

        run(){
            let enabled = this._load("Aktiviert") || 'false';
            if (enabled === 'false') {
                return;
            }

            let overviewSettings = this._load("Übersichts Notizen") || 'false';
            if (overviewSettings != 'disabled') {
                this._createOVerviewNotesHtml(overviewSettings);
            }
        }

        _createOVerviewNotesHtml(overviewSettings){
            let scope = this._load("Übersichts Notizen Gültigkeitsbereich");
            if (!scope){
                scope = "global"
            }

            //Get Reference Nodes
            const positionIndex = parseInt(overviewSettings)
            const anchorNodes = document.getElementsByClassName("infos")
            const overviewContainer = document.getElementsByClassName("infos")[2];
            const overviewHeadder = overviewContainer.firstElementChild;
            const overviewContent = overviewContainer.children[2];

            //Clone Reference Nodes and Modify
            const notesContainer = overviewContainer.cloneNode(false);
            const noteHeader = overviewHeadder.cloneNode();
            noteHeader.innerHTML = "Notizen";
            const notedataContaner = overviewContent.cloneNode();
            
            const textArea = document.createElement("textarea");
            textArea.style.marginTop = "20px";
            textArea.rows = 10;

            if (scope === 'global') {
                textArea.value = this._load("notes_overview");
            }
            else{
                textArea.value = this._load("notes_overview_" + this.page.getCurrentPlanet());
            }

            
            
            //add to HTML
            notedataContaner.appendChild(textArea);
            notesContainer.append(noteHeader, notedataContaner);

            if (anchorNodes.length === positionIndex){
                anchorNodes[positionIndex-1].parentNode.insertBefore(notesContainer, anchorNodes[positionIndex-1].nextSibling);
            }
            else{
                anchorNodes[positionIndex].parentNode.insertBefore(notesContainer, anchorNodes[positionIndex]);
            }

            //add Save
            const tath = this;
            textArea.addEventListener("input", function() {
                if (scope === 'global') {
                    tath._save("notes_overview", this.value)
                }
                else{
                    tath._save("notes_overview_" + tath.page.getCurrentPlanet(), this.value)
                }
            });
        }
    }

    //Main
    function run() {
        const page = new Page()
        switch (page.getPage()) {
            case "fleetstep1":
                pS.run()
                break;
            case "overview":
                notes.run()
                break;
            default:
                break;
        }
    }


    const pS = new PlanetShortcut()
    const notes = new Notes()
    const modules = [
        pS,
        notes
    ];
    const settings = new Settings()
    settings.setModules(modules)

    run()
})();