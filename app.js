
//Harita ekleme
var script = document.createElement("script");
script.src = "https://openlayers.org/en/v3.20.1/build/ol.js";
script.type = "text/javascript";
script.defer = true;
script.async = true;
//Kayıtlı koordinat
var ankara = ol.proj.transform(
  [32.7445451, 39.9305464],
  "EPSG:4326",
  "EPSG:3857"
);
//harita layers ayarlama
var layers = [];
layers.push(
  new ol.layer.Tile({
    visible: true,
    preload: Infinity,
    source: new ol.source.BingMaps({
      key: "AsZpNEEdyW1wZ3__26CoXTYbsTOrw8Wgy4hTM1SoklCWfHosKzoJ4awh28CXsJMs",
      imagerySet: "AerialWithLabelsOnDemand",
    }),
  })
);
//database
firebase.initializeApp({
  apiKey: "AIzaSyBIfFSU2EffY572LKT7H0-efyylfZAcJg4",
  authDomain: "geodotask.firebaseapp.com",
  databaseURL: "https://geodotask.firebaseio.com",
  projectId: "geodotask",
  storageBucket: "geodotask.appspot.com",
  messagingSenderId: "287984193571",
  appId: "1:287984193571:web:ff7a056e1eb41ad405e196",
});

var db = firebase.firestore();

//popup ekleme
var container = document.getElementById("popup");
var content = document.getElementById("popup-content");
var closer = document.getElementById("popup-closer");
//overlay ayarları
var overlay = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250,
  },
});
//Harita ayarları
var map = new ol.Map({
  layers: layers,
  controls: ol.control.defaults({
    attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
      collapsible: false,
    }),
  }),
  target: "map",
  overlays: [overlay],
  view: new ol.View({
    center: ankara,
    zoom: 6,
  }),
});
//Pan butonu
var panToAnkara = document.getElementById("pan-to-ankara");
panToAnkara.addEventListener(
  "click",
  function () {
    var pan = ol.animation.pan({
      duration: 2000,
      source: /** @type {ol.Coordinate} */ (map.getView().getCenter()),
    });
    map.beforeRender(pan);
    map.getView().setCenter(ankara);
    map.getView().setZoom(6);
  },
  false
);
var collection = new ol.Collection();
var source = new ol.source.Vector({
  wrapX: false,
  features: collection,
  useSpatialIndex: false,
});

var vector = new ol.layer.Vector({
  source: source,
});
//point ekleme
var savebuton = document.getElementById("save");
var featurething = new ol.Feature({
  name: "Point",
});
var point;
function addPoint() {
  point = new ol.interaction.Draw({
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: "#ffcc33",
        width: 2,
      }),
      image: new ol.style.Circle({
        //       //nokta
        radius: 5,
        fill: new ol.style.Fill({
          color: "#ffcc33",
        }),
      }),
    }),
    source: source,
    type: "Point",
  });
  vector.setMap(map);
  map.addInteraction(point);
  point.setActive(false);
}
//popup kapatma
closer.onclick = function () {
  container.style.display = "none";
  closer.blur();
  return false;
};


function activePoint() {
  point.setActive(true);
  map.on("click", function tıkla(e) {
    var coordinate = e.coordinate;
    var hdms = ol.coordinate.toStringHDMS(
      ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326")
    );
    
    content.innerHTML =
      "<p>Buraya tıkladınız:</p><code>" +
      hdms +
      "</code>" +
      "<br></br>" +
      '<label>Kapı No Giriniz: </label> <input type="text" id="kapı-no">' +
      "<br></br>" +
      '<label>Mahalle Kodunu Giriniz: </label> <input type="text" id="mahalle-kod">' +
      "<br></br>" +
      '<button id="save" value="KAYIT ">Kaydet</button>';
    container.style.display = "block";
    overlay.setPosition(coordinate);

    var savebuton = document.getElementById("save");
    savebuton.addEventListener("click", function (e) {
      var kapnovalue;
      kapnovalue = document.getElementById("kapı-no").value;
      var mahallekodvalue;
      mahallekodvalue = document.getElementById("mahalle-kod").value;

      container.style.display = "none";
      closer.blur();
      //verileri database'e kayıt etme
      db.collection("data")
        .add({
          Kapıno: kapnovalue,
          mahallekodu: mahallekodvalue,
          koordinatlar: hdms,
        })
        .then(function (docRef) {
          console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
        });

      var coodi3 = coordinate[0];
      
      var boylamdüz = ol.coordinate.toStringHDMS(
        ol.proj.transform(coodi3, "EPSG:3857", "EPSG:4326")
      );
      

      var hdms3 = ol.coordinate.toStringHDMS(
        ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326")
      );
     

      // console.log(hdms.replace(','));

      // return false;
      e.preventDefault();
    });

    map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
      point.setActive(false);
    });
    return;
  });
}
addPoint();
point.on("drawend", function cizim(e) {
  var currentFeature = e.feature;
  point.setActive(false);
});

//Polygon çizimi
var polygon;
function addPolygon() {
  polygon = new ol.interaction.Draw({
    source: source,
    type: "Polygon",
  });
  map.addInteraction(polygon);
  polygon.setActive(false);
}
function activePolygon() {
  //point.setActive(false);
  polygon.setActive(true);
}
addPolygon();

polygon.on("drawend", function (e) {
  var currentFeature2 = e.feature;
  polygon.setActive(false);
});

var pointsource = vector.getSource();
pointsource.addFeatures(collection);
//verileri çekme
var dbread= document.getElementById("db-read");
dbread.addEventListener("click",function(){

  db.collection("data")
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log("alınan koordinatlar:" + doc.data().koordinatlar+" koordinatı alınan kapı no,mahalle kodu: "+doc.data().Kapıno+" , "+doc.data().mahallekodu);
      var readdata = doc.data().koordinatlar;
      var template = "Coordinate is ({x},{y}).";
      
      // markerekle(readdata);
    });

   
  });

})

// function markerekle(readdata){
//   this.readdata= readdata;
//   console.log("aswfdasas "+readdata)
//   var lonLat = new ol.Coordinate( readdata )
                           
          
//     var zoom=8;

//     var markers = new ol.Layer.Markers( "Markers" );
//     map.addLayer(markers);
    
//     markers.addMarker(new OpenLayers.Marker(lonLat));
    
//     map.setCenter (lonLat, zoom);
// }