/*!
 * $modulename
 * Copyright(c) 2019 Stephane Potelle 
 * MIT Licensed
*/

xobject = require('../xobject') 
fs = require('fs')

function getActiveConfig( cfgObject ){
    var ret = xobject.clone(cfgObject) 
    var activeConfig = process.env["APP_ACTIVE_CONFIG"] || cfgObject['_configs'].activeConfig || 'none'
    ret['_configs'] = undefined
    if (typeof(cfgObject['_configs']) == 'object'){
        keys = Object.keys(cfgObject['_configs'])
        for (let i = 0; i< keys.length ; i++) {
            o = cfgObject['_configs'][keys[i]]
            if (typeof(o) == 'object') {
                if ( activeConfig == o.appliesTo || o.appliesTo.includes(activeConfig)) {
                    okeys = Object.keys(o)
                    for (p =0; p< okeys.length; p++) {
                        if (okeys[p] != 'appliesTo') 
                        ret[okeys[p]] = o[okeys[p]]
                    }
                }
            }
        }
    }
    return ret
}

async function loadConfigFileCB(baseConfigFileName, defaultConfig, callback) {
    // This function is not to be exported. It is the callback-version of the function.
    // it is exposed as 'loadConfigFile', which provides both the callback and promise 
    // behaviour, base on the parameters supplied.
    var cfgFile = baseConfigFileName || 'config.json'
    var cfgFileDef = cfgFile.replace('.json','.default.json')
    var cfg
    var content

    try {
        content = await fs.promises.readFile(cfgFile,'utf8')
    } catch(e) {
        try {
            content = await fs.promises.readFile(cfgFileDef,'utf8')
        } catch (e) {
            if (defaultConfig == undefined) callback(e )
            else callback(undefined, defaultConfig)
        }
    }

    try {
        let cfg = JSON.parse(content)
        cfg.activeConfig = function() { return getActiveConfig(cfg)}
        cfg.mergtoToEnv = function() { xobject.merge(process.env,cfg.activeConfig(), false )}
        callback(undefined,cfg)
    } catch (e) {
        if (defaultConfig == undefined) callback(e)
        else { 
            callback(undefined,  defaultConfig)
        }
    }
}

loadConfigFile = xobject.ESNextFunction(loadConfigFileCB)

if (module.parent) {
    exports.getActiveConfig = getActiveConfig
    exports.loadConfigFile = loadConfigFile
} else {
    process.env.APP_ACTIVE_CONFIG = 'cfg2'
    demo()
}

async function demo() {
    defaultConf = {
        parm1 : "Must set parm1",
        parm2 : "Must set parm1"
    }

    try {
        var cfg = await loadConfigFile('example-conf/config.json', defaultConf)
        console.log('JSON multiple configuration demo')
        console.log('Source configuration:')
        console.log(JSON.stringify(cfg, undefined, 4))
        console.log('Effective configuration:')
        console.log(JSON.stringify(cfg.activeConfig(), undefined, 4) )
        cfg.mergtoToEnv()
        console.log('process.env["DISPLAY"]: '+process.env["DISPLAY"] )
    } catch(e) { console.log(e)}    
}


