// ==UserScript==
// @name         Sc0ts Toolbox
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Sc0t
// @match        https://www.pr0game.com/uni*
// @match        https://pr0game.com/uni*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pr0game.com
// @updateURL    https://github.com/7Surfer/Sc0ts-Toolbox/raw/main/Sc0tsToolbox.user.js
// @downloadURL  https://github.com/7Surfer/Sc0ts-Toolbox/raw/main/Sc0tsToolbox.user.js
// @grant        none
// ==/UserScript==


/* ToDo:
    - Language support (Einstellungen)
*/

(function() {
    'use strict';
    const idPrefix = 'ST_';

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
            const settingsNode = menuOptions.filter(el => {return (el.children.length > 0 && el.firstChild.innerHTML === 'Einstellungen')})[0]
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
            const currentPage = window.location.search.split("=")[1].toLowerCase()
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
        static valueOptions = {
            Checkbox: "checkbox",
        }

        constructor() {
            //Singelton Implementation
            if (Settings._instance) {
                return Settings._instance
            }
            Settings._instance = this;
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
                const settingKey = moduleId + settingsLabel;

                // ID is used as uniq PRefix for the modules settings
                if (settingsLabel === 'id') {
                    continue;
                }

                if (settingsLabel === 'label') {
                    this._insertModulSettingsHeadderNode(settingsBody, settingsValue)
                }else{
                    const label = document.createElement('td');
                    label.width = "50%"
                    label.innerHTML= settingsLabel;
                    const setting = document.createElement('td');
                    setting.width = "50%"

                    switch (settingsValue) {
                        case Settings.valueOptions.Checkbox:
                            setting.appendChild(this._getCheckbox(settingKey));
                            break;
                    
                        default:
                            console.log("Something went wrong. Please contact Sc0t")
                            break;
                    }
                    
                    settingsBody.append(label, setting);
                }
            }
        }

        _getCheckbox(settingKey){
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            
            checkbox.addEventListener("change", function() {
                this.save(settingKey, checkbox.checked);
            }.bind(this));
            
            checkbox.checked = this.load(settingKey) === 'true' ;
            return checkbox
        }

        save(setting, value){
            localStorage.setItem(setting, value);
        }
        
        load(setting){
            return localStorage.getItem(setting)
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
    class PlanetShortcut {
        constructor() {
            this.moduleId = "PS";
            this.settings = new Settings()
            this.page = new Page();
        }

        getSettings(){
            let settingConfig = new Map();
            settingConfig.set('id', this.moduleId);
            settingConfig.set('label',"Planeten Shortcuts");
            settingConfig.set('Aktiviert',Settings.valueOptions.Checkbox);
            return settingConfig;
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
                    tath.settings.save(tath.moduleId + "settings", JSON.stringify(shortcutSettings))
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
            if (this.settings.load(this.moduleId + "Aktiviert")==='false') {
                return;
            }
            //load Current Settings
            let shortcutSettings = JSON.parse(this.settings.load(this.moduleId + "settings")) || {};

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

    //Main
    function run() {
        const page = new Page()
        switch (page.getPage()) {
            case "fleetstep1":
                pS.run()
                break;
            default:
                break;
        }
    }


    const pS = new PlanetShortcut()
    const modules = [
        pS,
    ];
    const settings = new Settings()
    settings.setModules(modules)

    run()
})();