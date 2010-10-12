/*globals module test ok isObj equals expects Namespace */

// ............................................................................
//
// Origin of the Test Data
//
// This test uses data about a few birds, their official abbreviations, and 
// bird feeder observations for each bird in several regions of the United 
// States.
//
// Bird feeder observation data comes from Cornell University's Project Feeder 
// Watch (http://watch.birds.cornell.edu/PFW/ExploreData), with data taken
// from the top 25 birds in two regions, the south-central and southeastern 
// United States for the 2008-2009 season.
//
// Visit this link to see a map, and click for the regions to see the data in 
// list form:
//
//   http://www.birds.cornell.edu/pfw/DataRetrieval/Top25/2008-2009/Top25.htm
//
// Abbreviation codes for the birds involved were looked up at birdpop.org, 
// which has a dbf file with abbreviations:
// 
//   http://www.birdpop.org/AlphaCodes.htm
//
//   For each bird, there is a four-letter abbreviation, a six-letter 
//   abbreviation, and the same common name that is in the feederObservations.  
//
// ............................................................................

// ONRTest is used as a global container.
var ONRTest = SC.Object.create();

// ONRTest.AppBase is here because if ONRTest.BirdApp = SC.Object.extend(.. 
// is used, the datasource will not instantiate properly. But if we use this 
// base object, the instantiation works...
ONRTest.AppBase = SC.Object.extend({
  NAMESPACE: null,
  models: null,
  readyCall: null,
  queries: null,
  dataSource: null,
  store: null,
  start: null,
  test: null,
  finish: null
});

// A simulated Sproutcore app, ONRTest.BirdApp, to test ONRWebsocketDataSource:
ONRTest.BirdApp = ONRTest.AppBase.create({
  // Simulating NAMESPACE for an SC app, set in core.js
  NAMESPACE: 'BirdApp',

  // Models in an SC app are stored as definitions in modelName.js files
  // in the models dir. They are instantiated by the system on startup.
  // Here we define the models as properties directly on our SC app, and
  // we will instantiate them in this.start(), keeping references to 
  // them in a hash called models.

  // The models hash; models will be instantiated in this.start(), and
  // references stored here.
  models: {},

  //
  // Data for birds, feeder observations, and abbreviations were
  // put into hashes to allow convenient creation of data in special
  // callback functions that call controllers. There is also a hash
  // within to hold records that are created from the data.
  //
  data: { "Eastern Towhee":     { key: 1, taxonomy: { genus: "Pipilo", species: "erythrophthalmus"},
                                  feederObservations: [{ key: 1, season: "2008-2009", 
                                                         region: "Southeastern US", 
                                                         rank: 17, 
                                                         percentageOfFeedersVisited: 49.60, 
                                                         meanGroupSizeWhenSeen: 1.49, 
                                                         feederwatchAbundanceIndex: 0.25}],
                                  abbreviations: [{ key: 1, type: 'fourLetter', text: "EATO" }, 
                                                  { key: 2, type: 'sixLetter', text: "PIPERP" }],
                                  records: { bird: null,
                                             abbreviations: [],
                                             feederObservations: []}},
          "House Finch":        { key: 2, taxonomy: { genus: "Carpodacus", species: "mexicanus"},
                                  feederObservations: [{ key: 2, season: "2008-2009",        // Two for House Finch
                                                         region: "Southeastern US", 
                                                         rank: 8, 
                                                         percentageOfFeedersVisited: 74.17, 
                                                         meanGroupSizeWhenSeen: 3.38, 
                                                         feederwatchAbundanceIndex: 1.32},
                                                       { key: 3, season: "2008-2009", 
                                                         region: "South Central US", 
                                                         rank: 6, 
                                                         percentageOfFeedersVisited: 75.37, 
                                                         meanGroupSizeWhenSeen: 3.58, 
                                                         feederwatchAbundanceIndex: 1.23}],
                                   abbreviations: [{ key: 3, type: 'fourLetter', text: "HOFI"}, 
                                                   { key: 4, type: 'sixLetter', text: "CARMEX"}],
                                   records: { bird: null,
                                              abbreviations: [],
                                              feederObservations: []}},
          "Ruby-crowned Kinglet": { key: 3, taxonomy: { genus: "Regulus", species: "calendula"},
                                    feederObservations: [{ key: 4, season: "2008-2009", 
                                                           region: "South Central US", 
                                                           rank: 22, 
                                                           percentageOfFeedersVisited: 39.76, 
                                                           meanGroupSizeWhenSeen: 1.17, 
                                                           feederwatchAbundanceIndex: 0.14}],
                                    abbreviations: [{ key: 5, type: 'fourLetter', text: "RCKI"}, 
                                                    { key: 6, type: 'sixLetter', text: "REGCAL"}],
                                    records: { bird: null,
                                               abbreviations: [],
                                               feederObservations: []}}},
  // Model definitions
  Abbreviation: SC.Record.extend({
    primaryKey:  'key',
    bucket:      'abbreviation',
    type:        SC.Record.attr(String),
    text:        SC.Record.attr(String),

    bird: SC.Record.toOne("ONRTest.BirdApp.Bird", 
                          { inverse: "abbreviations", isMaster: NO })

//    // A callback firing on status === READY_CLEAN
//    _statusObs: function(){ 
//      var status = this.get('status'); 
//      if (status && status === SC.Record.READY_CLEAN){ 
//        ONRTest.BirdApp.readyCall(this.get('storeKey')); 
//      }
//    }.observes('status')
  }),

  FeederObservation: SC.Record.extend({
    primaryKey:                 'key',
    bucket:                     'feederObservation',
    season:                     SC.Record.attr(String),
    region:                     SC.Record.attr(String),
    rank:                       SC.Record.attr(Number),
    percentageOfFeedersVisited: SC.Record.attr(Number),
    meanGroupSizeWhenSeen:      SC.Record.attr(Number),
    feederwatchAbundanceIndex:  SC.Record.attr(Number),

    bird: SC.Record.toOne("ONRTest.BirdApp.Bird", 
                          { inverse: "feederObservations",
                            isMaster: NO })
  }),

    // A callback firing on bird changes
//    _birdObs: function(){ 
//      var bird = this.get('bird'); 
//      var storeKey = this.get('storeKey');
//      console.log('storeKey ' + storeKey);
//      console.log('recordType ' + SC.Store.recordTypeFor(storeKey));
//      console.log('id ' + ONRTest.BirdApp.store.idFor(storeKey));
//      console.log('statusString ' + ONRTest.BirdApp.store.statusString(storeKey));
//      console.log('rec ' + ONRTest.BirdApp.store.materializeRecord(storeKey));
//      if (bird){ 
//        ONRTest.BirdApp.birdSetCall(this.get('storeKey')); 
//      }
//    }.observes('bird')

//    // A callback firing on status === READY_CLEAN
//    _statusObs: function(){ 
//      var status = this.get('status'); 
//      if (status && status === SC.Record.READY_CLEAN){ 
//        ONRTest.BirdApp.readyCall(this.get('storeKey')); 
//      }
//    }.observes('status')

  Bird: SC.Record.extend({
    primaryKey:  'key',
    bucket:      'bird',
    commonName:  SC.Record.attr(String),
    genus:       SC.Record.attr(String),
    species:     SC.Record.attr(String),
  
    // computed property (recalculates when genus or species changes):
    scientificName: function(){
      return this.getEach('genus', 'species').compact().join(' ');
    }.property('genus', 'species').cacheable(),
    
    // relations:
    abbreviations:      SC.Record.toMany("ONRTest.BirdApp.Abbreviation", 
                                         { inverse: "bird", isMaster: YES }),
    feederObservations: SC.Record.toMany("ONRTest.BirdApp.FeederObservation", 
                                         { inverse: "bird", isMaster: YES })
  }),

//    _loadedObs: function(){
//      console.log('ISLOADED: ' + this.get('isLoaded'));
//      console.log('  ' + this.get('genus'));
//      //var manyAbbreviations = this.get('abbreviations');
//      //for (var i=0,len=manyAbbreviations.get('length'); i<len; i++){
//      //  if (abr === undefined){
//      //    console.log('      undefined ');
//      //  }
//      //}
//    }.observes('isLoaded'),
//
//    // A callback firing on status === READY_CLEAN
//    _statusObs: function(){ 
//      var status = this.get('status'); 
//      if (status && status === SC.Record.READY_CLEAN){ 
//        ONRTest.BirdApp.readyCall(this.get('storeKey')); 
//      }
//    }.observes('status')
//

  // birdSetCall will fire when the bird reference is set in an abbreviation
  // or feederObservation.
//  birdSetCall: function(storeKey){
//    var recordType = SC.Store.recordTypeFor(storeKey);
//    var id = ONRTest.BirdApp.store.idFor(storeKey);
//    var statusString = ONRTest.BirdApp.store.statusString(storeKey);
//    var rec = ONRTest.BirdApp.store.materializeRecord(storeKey);
//    var bird = rec.get('bird');
//    console.log('BIRD SET ' + recordType + '/' 
//                            + id + '/' 
//                            + statusString + '/' 
//                            + bird.get('commonName'));
//  },

  // readyCall will fire when the status of any record changes to READY_CLEAN.
  //   (Trying to get a look at relations...)
//  readyCall: function(storeKey){
//    var recordType = SC.Store.recordTypeFor(storeKey);
//    var id = ONRTest.BirdApp.store.idFor(storeKey);
//    var statusString = ONRTest.BirdApp.store.statusString(storeKey);
//    var rec = ONRTest.BirdApp.store.materializeRecord(storeKey);
//    console.log(recordType + '/' + id + '/' + statusString);
//    //console.log(JSON.stringify(ONRTest.BirdApp.store.readDataHash(storeKey)));
//    var recordCount = ONRTest.BirdApp.get('recordCount');
//    ONRTest.BirdApp.set('recordCount', recordCount+1);
//    if (recordType === ONRTest.BirdApp.Bird){
//      console.log('ABBREVIATIONS');
//      var abbreviations = rec.get('abbreviations');
//      for (var i=0,len=abbreviations.length; i<len; i++){
//        console.log(abbreviations[i].get('text'));
//      }
//      var feederObservations = rec.get('feederObservations');
//      console.log('FEEDER OBSERVATIONS');
//      for (i=0,len=feederObservations.length; i<len; i++){
//        console.log(feederObservations[i].get('region'));
//      }
//    }
//    else {
//      console.log('BIRD');
//      var bird = rec.get('bird');
//      //if (bird) console.log(bird.get('commonName'));
//    }
//  },

  // For storing queries that would be defined in core.js
  queries: {},

  // For controllers that would be in controllers dir
  controllers: {},

  // For views that would be in resources (english.lproj) dir or views dir
  views: {},

  // For datasource that would be in data_sources dir
  dataSource: SC.ONRWebsocketDataSource.extend({
    authSuccessCallback: function(){
      ONRTest.BirdApp.test();
    }
  }),

  // For the store, that would be defined in core.js
  store: SC.Store.create({
    //commitRecordsAutomatically: YES
  }).from('ONRTest.BirdApp.dataSource'),

  // A count of all records created in the test that have been
  // marked READY_CLEAN.
  recordCount: 0,

  // An observer of the total number of records created.
  recordsDidLoad: function(){
    console.log('recordCount: ' + ONRTest.BirdApp.recordCount);
    if (ONRTest.BirdApp.recordCount === 13) ONRTest.BirdApp.finish();
  }.observes('recordCount'),

  generateCacheKey: function(){
    // the idea for this method was copied from the php site: 
    // http://www.php.net/manual/en/function.session-regenerate-id.php#60478
    var keyLength = 32,
        keySource = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        keySourceLength = keySource.length + 1, // we need to add one, to make sure the last character will be used in generating the key
        ret = [],
        curCharIndex = 0;
      
    for(var i=0;i<=keyLength;i++){
       curCharIndex = Math.floor(Math.random()*keySourceLength);
       ret.push(keySource[curCharIndex]);
    }
    return ret.join('');
  },
  
  start: function(){
    // 
    // This function is called by ONRTest.start(), which is called on loading 
    // of index.html.
    //
    // At this point:
    //
    //   - this.dataSource has authSuccessCallback set to come to this.test().
    //
    // Things to do here:
    //
    //   - Instantiate the models.
    //   - Force instantiation of the store.
    //   - Make the websocket connection.
    //   - Create queries, controllers, etc.
    //
    console.log("STARTING BirdApp");
    console.log("INSTANTIATING models, store");

    // Instantiate models, keeping references in this.models
    this.models['abbreviation'] = this.Abbreviation();
    this.models['feederObservation'] = this.FeederObservation();
    this.models['bird'] = this.Bird();

    // Create the data source if it doesn't exist already. (FORCE)
    var initDS = this.store._getDataSource(); 

    // Call auth. The data source contains a callback to the test() function.
    // test() will initiate data creation steps. 
    this.store.dataSource.connect(ONRTest.BirdApp.store,function(){ 
      ONRTest.BirdApp.store.dataSource.authRequest("test","test");
    });

    // Create queries for later use, as would be done in core.js of a 
    // Sproutcore app.
    this.queries['abbreviation'] = {};
    this.queries['abbreviation']['all'] = SC.Query.create({
      recordType: ONRTest.BirdApp.Abbreviation
    });

    this.queries['feederObservation'] = {};
    this.queries['feederObservation']['all'] = SC.Query.create({
      recordType: ONRTest.BirdApp.FeederObservation
    });
    
    this.queries['bird'] = {};
    this.queries['bird']['all'] = SC.Query.create({
      recordType: ONRTest.BirdApp.Bird
    });
    this.queries['bird']['Kinglet'] = SC.Query.create({ 
      conditions: "genus = {gn_ltrs} AND commonName CONTAINS {ltrs}", 
      parameters: { gn_ltrs:"Regulus", ltrs:"Kinglet"},
      recordType: ONRTest.BirdApp.Bird
    });
    this.queries['bird']['Finch'] = SC.Query.create({ 
      conditions: "genus = {gn_ltrs} AND commonName CONTAINS {ltrs}", 
      parameters: { gn_ltrs:"Carpodacus", ltrs:"Finch"},
      recordType: ONRTest.BirdApp.Bird
    });

    // Create the controllers.
    this.controllers['feederObservation'] = SC.ArrayController.create({
      // This is a closure, that will create an unnamed function, for checking
      // for completion of feederObservations records. The generator function
      // has commonName, feederObservation as passed-in variables which are in 
      // scope for the generated function. The 'var me = this;' line sets me so
      // that there is also a reference to the controller within the generated
      // function.
      generateCheckFeederObservationsFunction: function(commonName,feederObservation){
        var me = this;
        return function(val){
          //console.log('checking FeederObservations ' + commonName + '/' + val);
          if (val & SC.Record.READY_CLEAN){
            me._tmpRecordCache[commonName].pushObject(feederObservation);
            ONRTest.BirdApp.data[commonName]['records']['feederObservations'].pushObject(feederObservation);
            //console.log(SC.inspect(ONRTest.BirdApp.data[commonName]['records']['feederObservations']));
            me._tmpRecordCacheCount[commonName]--;
            //console.log('checking FeederObservations ' + commonName + '/' + me._tmpRecordCacheCount[commonName]);
            if (me._tmpRecordCacheCount[commonName] === 0){
              delete me._tmpRecordCache[commonName]; // delete the old contents
              delete me._tmpRecordCacheCount[commonName];
              ONRTest.BirdApp.controllers['abbreviation'].createAbbreviations(commonName);
            }
            return YES;
          }
          else return NO;
        };
      },
 
      createFeederObservations: function(commonName){
        //console.log('createFeederObservations ' + commonName);
        var feederObservations = ONRTest.BirdApp.data[commonName]['feederObservations'];
    
        this._tmpRecordCache[commonName] = [];
        this._tmpRecordCacheCount[commonName] = feederObservations.length;
            
        for (var i=0,len=feederObservations.length; i<len; i++){
          var feederObservation;
          feederObservation = ONRTest.BirdApp.store.createRecord(ONRTest.BirdApp.FeederObservation, {
            "key":                       feederObservations[i].key,
            "season":                     feederObservations[i].season,
            "region":                     feederObservations[i].region,
            "rank":                       feederObservations[i].rank,
            "percentageOfFeedersVisited": feederObservations[i].percentageOfFeedersVisited,
            "meanGroupSizeWhenSeen":      feederObservations[i].meanGroupSizeWhenSeen,
            "feederwatchAbundanceIndex":  feederObservations[i].feederwatchAbundanceIndex});

          // this.generateCheckFeederObservationsFunction is provided to create the function that
          // checks for READY_CLEAN for all feederObservations for a given bird. When all such 
          // feederObservations are READY_CLEAN, in turn, createAbbreviations(), the next step in 
          // the data creation scheme, is fired.
          feederObservation.addFiniteObserver('status',this,this.generateCheckFeederObservationsFunction(commonName,feederObservation),this);

          ONRTest.BirdApp.store.commitRecords();
        }
      },

      // _tmpRecordCache are for feederObservations that have been created. _tmpRecordCacheCount is
      // initially set to the number of feederObservations that should be created for the given bird.
      // Then, as feederObservations are created, the count is decremented. The count is checked, so
      // that, when 0, the next step in the data creation scheme is fired (createAbbreviations()).
      _tmpRecordCache: {},
      _tmpRecordCacheCount: {}

    });
        
    this.controllers['abbreviation'] = SC.ArrayController.create({
      // See comment above about the creation of a closure -- same logic applies here, except
      // for abbreviations this time.  Once abbreviation records for a bird have been created,
      // the final step, creation of the actual bird record, is fired.
      generateCheckAbbreviationsFunction: function(commonName,abbreviation){
        var me = this;
        return function(val){
          //console.log('checking Abbreviations ' + commonName);
          if (val & SC.Record.READY_CLEAN){
            me._tmpRecordCache[commonName].pushObject(abbreviation);
            ONRTest.BirdApp.data[commonName]['records']['abbreviations'].pushObject(abbreviation);
            me._tmpRecordCacheCount[commonName]--;
            if (me._tmpRecordCacheCount[commonName] === 0){
              delete me._tmpRecordCache[commonName]; // delete the old contents
              delete me._tmpRecordCacheCount[commonName];
              ONRTest.BirdApp.controllers['bird'].createBird(commonName);
            }
            return YES;
          }
          else return NO;
        };
      },
 
      createAbbreviations: function(commonName){
        //console.log('createAbbreviations ' + commonName);
        var abbreviations = ONRTest.BirdApp.data[commonName]['abbreviations'];
    
        this._tmpRecordCache[commonName] = [];
        this._tmpRecordCacheCount[commonName] = abbreviations.length;
            
        for (var i=0,len=abbreviations.length; i<len; i++){
          var abbreviation;
          abbreviation = ONRTest.BirdApp.store.createRecord(ONRTest.BirdApp.Abbreviation, {
            "key": abbreviations[i].key,
            "type": abbreviations[i].type,
            "text": abbreviations[i].text
          });

          ONRTest.BirdApp.store.commitRecords();

          // this.generateCheckAbbreviationsFunction() is provided here to fire createBird as the final
          // step in data creation, which will set relations between feederObservations, abbreviations,
          // and the bird after the bird record has been committed.
          abbreviation.addFiniteObserver('status',this,this.generateCheckAbbreviationsFunction(commonName,abbreviation),this);
        }
      },

      // See comment above, in the feederObservations controller, about the use of _tmpRecordCache,Count.
      _tmpRecordCache: {},
      _tmpRecordCacheCount: {}

    });

    this.controllers['bird'] = SC.ArrayController.create({
      // See comments in the other controllers about the use of closures.
      generateSetRelationsFunction: function(commonName){
        var me = this;
        return function(val){
          if (val & SC.Record.READY_CLEAN){
            //console.log('setting relations for Bird ' + commonName);
            me._tmpRecordCache[commonName].pushObject(bird);
            me._tmpRecordCacheCount[commonName]--;
            if (me._tmpRecordCacheCount[commonName] === 0){
              delete me._tmpRecordCache[commonName]; // delete the old contents
              delete me._tmpRecordCacheCount[commonName];

              var bird = ONRTest.BirdApp.data[commonName]['records']['bird'];

              var feederObservations = ONRTest.BirdApp.data[commonName]['records']['feederObservations'];
              var feederObservationsInBird = bird.get('feederObservations');
              feederObservationsInBird.pushObjects(feederObservations);

              var abbreviations = ONRTest.BirdApp.data[commonName]['records']['abbreviations'];
              var abbreviationsInBird = bird.get('abbreviations');
              abbreviationsInBird.pushObjects(abbreviations);

              ONRTest.BirdApp.store.commitRecords();
            }
            return YES;
          }
          else return NO;
        };
      },
 
      createBird: function(commonName){
        //console.log('createBird ' + commonName);
        var key = ONRTest.BirdApp.data[commonName]['key'];
        var taxonomy = ONRTest.BirdApp.data[commonName]['taxonomy'];

        this._tmpRecordCache[commonName] = [];
        this._tmpRecordCacheCount[commonName] = 1;
            
        var bird;
        bird = ONRTest.BirdApp.store.createRecord(ONRTest.BirdApp.Bird, {
          "key":       key,
          "commonName": commonName,
          "genus":      taxonomy.genus,
          "species":    taxonomy.species
        });

        ONRTest.BirdApp.store.commitRecords();

        ONRTest.BirdApp.data[commonName]['records']['bird'] = bird;

        // The bird record has been created, and its feederObservations and 
        // abbreviations, so all that is left is the setting of relations between them,
        // once the bird record comes back READY_CLEAN.
        bird.addFiniteObserver('status',this,this.generateSetRelationsFunction(commonName),this);

        return bird;
      },

      _tmpRecordCache: {},
      _tmpRecordCacheCount: {}

    });

    // Add views
//    this.views['birdEntryPane'] = SC.SheetPane.create({
//      layout: { width:400, height: 200, centerX: 0 },
//      contentView: SC.View.extend({
//         layout: { top: 0, right: 0, bottom: 0, left: 700 },
//         childViews: "headerLabel commonNameLabel genusLabel speciesLabel commonNameInput genusInput speciesInput cancelButton saveButton".w(),
//   
//         headerLabel: SC.LabelView.design({
//            layout: { height: 25, width: 250, bottom: 150, centerX: 500 },
//            textAlign: SC.ALIGN_CENTER,
//            value: 'ONRTest Bird App Simulator'
//         }),
//  
//         commonNameLabel: SC.LabelView.design({
//            layout: { height: 25, width: 150, bottom: 100, centerX: 500 },
//            textAlign: SC.ALIGN_CENTER,
//            value: 'Common name:'
//         }),
//  
//         genusLabel: SC.LabelView.design({
//            layout: { height: 25, width: 150, bottom: 100, centerX: 600 },
//            textAlign: SC.ALIGN_CENTER,
//            value: 'Genus:'
//         }),               
//         
//         speciesLabel: SC.LabelView.design({
//            layout: { height: 25, width: 150, bottom: 100, centerX: 700 },
//            textAlign: SC.ALIGN_CENTER,
//            value: 'Species:'
//         }),               
//         
//         commonNameInput: SC.TextFieldView.design({
//           layout: { height: 25, width: 150, bottom: 80, centerX: 500 },
//           hint: 'Common name...',
//           isPassword: NO,
//           isTextArea: NO
//         }),
//         
//         genusInput: SC.TextFieldView.design({
//           layout: { height: 25, width: 150, bottom: 80, centerX: 600 },
//           hint: 'Genus...',
//           isPassword: NO,
//           isTextArea: NO
//         }),
//         
//         speciesInput: SC.TextFieldView.design({
//           layout: { height: 25, width: 150, bottom: 80, centerX: 700 },
//           hint: 'Species...',
//           isPassword: NO,
//           isTextArea: NO
//         }),
//         
//         cancelButton: SC.ButtonView.design({
//           layout: { height: 25, width: 100, bottom: 50, centerX: 550},
//           title: 'Close',
//           action: 'closeLoginPane',
//           target: this
//         }),
//         
//         saveButton: SC.ButtonView.design({
//           layout: { height: 25, width: 100, bottom: 50, centerX: 50 },
//           title: 'Save',
//           action: 'attemptSaveBird',
//           target: this,
//           isDefault: YES
//         })
//      })
//    });
  },
   
  test: function(){
    //
    // Each item in the data contains information about a single
    // bird.  Calls are made to the controllers, to the respective 
    // addBird(), createFeederObservation(), and createAbbreviation() functions, 
    // which make createRecord requests, in logic based on creating the
    // master bird objects last, and using callbacks for control, waiting 
    // until the abbreviation and feederObservation records are READY_CLEAN 
    // before creating the master bird record and setting relations.
    //
    // At one point in development, a simple list of records was kept, 
    // to know when all have been created, before continuing with test 
    // operations. This was replaced by a system based on callbacks.
    //
    //     In this test, 3 birds, 4 feederOperations, and 6 abbreviations
    //     will be created, for a total of 13 records.
    //

    console.log('CALL TO test()');

//    // Show the bird entry pane [EXPERIMENTAL -- layout needs work]
//    this.views['birdEntryPane'].append();

    // Feeder observations first, then the other creation calls will fire in
    // succession, waiting on READY_CLEAN for dependencies.
    for (var commonName in this.data){
      this.controllers['feederObservation'].createFeederObservations(commonName);
    }

    setTimeout(ONRTest.BirdApp.checkBirds, 10000);
  },

  checkBirds: function(){
    console.log('CHECKBIRDS');
    var birds = ONRTest.BirdApp.store.find(ONRTest.BirdApp.queries['bird']['all']);

    birds.forEach(function(bird) {
      console.log(bird.get('commonName'), bird.get('genus'), bird.get('species'));
      bird.get('feederObservations').forEach(function(fo) {
        console.log('    feeder observation:');
        console.log('        season:                     ' + fo.get('season'));
        console.log('        region:                     ' + fo.get('region'));
        console.log('        rank:                       ' + fo.get('rank'));
        console.log('        percentageOfFeedersVisited: ' + fo.get('percentageOfFeedersVisited'));
        console.log('        meanGroupSizeWhenSeen:      ' + fo.get('meanGroupSizeWhenSeen'));
        console.log('        feederwatchAbundanceIndex:  ' + fo.get('feederwatchAbundanceIndex'));
      });

      bird.get('abbreviations').forEach(function(a) {
        console.log('    abbreviation: ' + a.get('text'));
      });
    });
  },

  // 
  // Tear-down
  //
  finish: function(){
    console.log('FINISHING');
  }
});

// A simulated Sproutcore app, ONRTest.BirdApp, to test ONRXHRPollingDataSource:
ONRTest.PollingApp = ONRTest.AppBase.create({
  NAMESPACE: 'PollingApp',
  models: {},
  data: {},
  queries: {},
  controllers: {},

  dataSource: SC.ONRWebsocketDataSource.extend({
    authSuccessCallback: function(){
      ONRTest.PollingApp.test();
    }
  }),

  store: SC.Store.create({
    //commitRecordsAutomatically: YES
  }).from('ONRTest.PollingApp.dataSource'),

  start: function(){
    console.log("STARTING PollingApp");

    // Create the data source if it doesn't exist already. (FORCE)
    var initDS = this.store._getDataSource(); 

    // Call auth. The data source contains a callback to the test() function.
    this.store.dataSource.connect(ONRTest.PollingApp.store,function(){ 
      ONRTest.PollingApp.store.dataSource.authRequest("test","test");
    });
  },

  test: function(){
    console.log('READY TO TEST POLLING');
  }
});


ONRTest.start = function(){
  console.log("STARTING CLIENTS");

  this.clients = {};
  //this.clients['FetchKinglet'] = ONRTest.BirdApp;
  //this.clients['FetchFinch'] = ONRTest.BirdApp;
  this.clients['BirdApp'] = ONRTest.BirdApp;
  //this.clients['PollingApp'] = ONRTest.PollingApp;

  for (var clientName in ONRTest.clients){
    ONRTest.clients[clientName].start();
  }
};

