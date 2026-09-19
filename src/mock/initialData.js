import tona_12 from "../assets/Imagenes/tona_12.png";
import tona_lata from "../assets/Imagenes/tona_lata.png";
import tona_litro from "../assets/Imagenes/tona_litro.png";
import clasica_12 from "../assets/Imagenes/clasica_12.png";
import clasica_lata from "../assets/Imagenes/clasica_lata.png";
import clasica_litro from "../assets/Imagenes/litro_clasica.png";
import spark_triple from "../assets/Imagenes/spark_3berry.png";
import spark_rosada from "../assets/Imagenes/spark_rosada.png";
import spark_naket from "../assets/Imagenes/spark_naked.png";
import  spark_mandarina from "../assets/Imagenes/spark_mandarina.png";
import ultra_tona from "../assets/Imagenes/tona_ultra.png";
import sol from "../assets/Imagenes/sol.png";
import heineken from "../assets/Imagenes/heineken.png";
import miller from "../assets/Imagenes/miller.png";
import Smirnof from "../assets/Imagenes/smirnof_verde.png";
import SmirnoR from "../assets/Imagenes/smirnof_roja.png";
import bambu_daykiri from "../assets/Imagenes/bambo_daikiry.png";
import bambu_pina from "../assets/Imagenes/bambo_pina.png";
import granReserva from "../assets/Imagenes/granreserva.png";
import reservamedia from "../assets/Imagenes/granreserva2.png";
import ultralite from "../assets/Imagenes/ultralitro.png";
import ultralitemedio from "../assets/Imagenes/ultramedio.png";
import extraLite from "../assets/Imagenes/extralitelitro.png";
import platalitro from  "../assets/Imagenes/platalitro.png";
import platamedio from "../assets/Imagenes/platamedio.png";
import alitas6 from  "../assets/Imagenes/alitas6.png";
import alitas12 from  "../assets/Imagenes/alitas12.png";
import salichipapa from "../assets/Imagenes/salchipapa.png";
import nachos from  "../assets/Imagenes/nachos150.png";
import nachosG from  "../assets/Imagenes/nachos250.png";
import hamburguesapapa from "../assets/Imagenes/hamburguesapapa.png"; 
import hotdog from  "../assets/Imagenes/hotdog.png"; 
import hotdogpapa from  "../assets/Imagenes/hotdogpapas.png"; 
import consume from  "../assets/Imagenes/consumedepollo.png"; 
import tostonaso from "../assets/Imagenes/tostonazo.png"; 
import chubbynegra from "../assets/Imagenes/chubbynegra.png"; 
import chubbynaranja from "../assets/Imagenes/chubbynaranja.png"; 
import chubbyrojo from "../assets/Imagenes/chubbyrojo.png"; 
import chubbyfresca from "../assets/Imagenes/chubbyfresca.png"; 
import powerR from  "../assets/Imagenes/powerrojo.png";
import powerA from   "../assets/Imagenes/powerazul.png";
import gateroR from  "../assets/Imagenes/gatoraderojo.png";
import gateroA from   "../assets/Imagenes/gatoradeazul.png";
import lipton from "../assets/Imagenes/lipton.png";
import hci from "../assets/Imagenes/hci.png";
import agualitro from "../assets/Imagenes/agualitro.png";
import aguamedio from "../assets/Imagenes/aguamedio.png";
import ensap from "../assets/Imagenes/ensaplastico.png";
import ensav from "../assets/Imagenes/ensavidrio.png";
import pepsi from "../assets/Imagenes/pepsividrio.png";
import cubetazotona from  "../assets/Imagenes/cubetazo_tona.png";
import cubetazoclasica from  "../assets/Imagenes/cubetazoclasica.png";





export const CATEGORIES = [
  { id: "cervezas", name: "Cervezas", icon: "Beer" },

  { id: "licores", name: "Licores", icon: "GlassWater" },

  { id: "comida", name: "Comidas", icon: "Utensils" },
  {
    id: "Bebida sin alcohol",
    name: "Bebida sin alcohol",
    icon: "RiDrinks2Fill",
  },
   { id: "promociones", name: "promociones", icon: "MdLocalOffer" },

];

export const INITIAL_PRODUCTS = [
  // CERVEZAS (Con control de inventario)
  {
    id: 1,
    name: "TOÑA 12 ONZA",
    category: "cervezas",
    price: 70,
    stock: null,
    image: tona_12,
  },
  {
    id: 2,
    name: "TOÑA LATA PEQUEÑA",
    category: "cervezas",
    price: 70,
    stock: null,
    image: tona_lata,
  },
  {
    id: 3,
    name: "TOÑA LITRO",
    category: "cervezas",
    price: 70,
    stock: null,
    image: tona_litro,
  },
  {
    id: 4,
    name: "CLASICA 12 ONZA",
    category: "cervezas",
    price: 75,
    stock: null,
    image: clasica_12,
  },
  {
    id: 5,
    name: "CLASICA LATA PEQUEÑA",
    category: "cervezas",
    price: 100,
    stock: null,
    image: clasica_lata,
  },
  {
    id: 6,
    name: "CLASICA LITRO",
    category: "cervezas",
    price: 100,
    stock: null,
    image: clasica_litro,
  },
  {
    id: 7,
    name: "SPARK TRIPLE BERRY",
    category: "cervezas",
    price: 115,
    stock: null,
    image: spark_triple,
  },
  {
    id: 8,
    name: "SPARK ROSADA",
    category: "cervezas",
    price: 100,
    stock: null,
    image: spark_rosada,
  },
  {
    id: 9,
    name: "SPARK NAKET",
    category: "cervezas",
    price: 100,
    stock: null,
    image: spark_naket,
  },
  {
    id: 10,
    name: "SPARK MANDARINA",
    category: "cervezas",
    price: 100,
    stock: null,
    image: spark_mandarina,
  },
  {
    id: 11,
    name: "ULTRA TOÑA",
    category: "cervezas",
    price: 100,
    stock: null,
    image: ultra_tona,
  },
  {
    id: 12,
    name: "SOL",
    category: "cervezas",
    price: 100,
    stock: null,
    image: sol,
  },
  {
    id: 13,
    name: "HEINEKEN ",
    category: "cervezas",
    price: 100,
    stock: null,
    image: heineken,  
  
  },
  {
    id: 14,
    name: "MILLER",
    category: "cervezas",
    price: 100,
    stock: null,
    image: miller,
     
  },
  {
    id: 15,
    name: "SMIRNOF VERDE",
    category: "cervezas",
    price: 100,
    stock: null,
    image:Smirnof,
      
  },
  {
    id: 16,
    name: "SMIRNOF ROJA",
    category: "cervezas",
    price: 100,
    stock: null,
    image:
      SmirnoR,
  },
  {
    id: 17,
    name: "BAMBU DAYKIRI",
    category: "cervezas",
    price: 100,
    stock: null,
    image: bambu_daykiri,
    
  },

  {
    id: 18,
    name: "BAMBU PIÑA",
    category: "cervezas",
    price: 100,
    stock: null,
    image:
      bambu_pina,
  },

  // LICORES (Con control de inventario - precio por trago)
  {
    id: 19,
    name: "RESERVA LITRO ",
    category: "licores",
    price: 135,
    stock: null,
    image: granReserva,
  },
  {
    id: 20,
    name: "RESERVA MEDIA ",
    category: "licores",
    price: 195,
    stock: null,
    image: reservamedia,
  },
  {
    id: 21,
    name: "EXTRA LITE LITRO",
    category: "licores",
    price: 185,
    stock: null,
    image:
     extraLite,
  },
  {
    id: 22,
    name: "ULTRA LITRO ",
    category: "licores",
    price: 265,
    stock: null,
    image:
      ultralite,
  },
  {
    id: 23,
    name: "ULTRA MEDIA ",
    category: "licores",
    price: 285,
    stock: null,
    image:
   ultralitemedio,
  },
  {
    id: 24,
    name: "PLATA LITRO ",
    category: "licores",
    price: 305,
    stock: null,
    image:
     platalitro
  },
  {
    id: 25,
    name: "PLATA MEDIA",
    category: "licores",
    price: 225,
    stock: null,
    image:
      platamedio
  },
 

  // Todos los productos operan sin control de inventario (stock: null).
  {
    id: 26,
    name: "ALITAS DE 6",
    category: "comida",
    price: 325,
    stock: null,
    image:
    alitas6
  },
  {
    id: 27,
    name: "ALITAS DE 12",
    category: "comida",
    price: 285,
    stock: null,
    image:
      alitas12
  },
  {
    id: 28,
    name: "SALCHIPAPA",
    category: "comida",
    price: 355,
    stock: null,
    image:
     salichipapa
  },
  {
    id: 29,
    name: "NACHOS",
    category: "comida",
    price: 135,
    stock: null,
    image:
     nachos
  },
  {
    id: 30,
    name: "HAMBURGUESA CON PAPAS",
    category: "comida",
    price: 195,
    stock: null,
    image:
      hamburguesapapa
  },
  {
    id: 31,
    name: "HOT DOG SIN PAPAS",
    category: "comida",
    price: 125,
    stock: null,
    image:
      hotdog
  },
  {
    id: 32,
    name: "HOT DOG CON PAPAS",
    category: "comida",
    price: 225,
    stock: null,
    image:
      hotdogpapa
  },
  {
    id: 33,
    name: "CONSUME DE POLLO",
    category: "comida",
    price: 265,
    stock: null,
    image:
      consume
  },
  {
    id: 34,
    name: "TOSTONASO LOCO",
    category: "comida",
    price: 305,
    stock: null,
    image:
      tostonaso,
  },
  
  // Bebidas sin alchol (Con control de inventario)
  {
    id: 35,
    name: "CHOVI NEGRA ",
    category: "Bebida sin alcohol",
    price: 215,
    stock: null,
    image:
      chubbynegra,
  },
  {
    id: 36,
    name: "CHOVI ROJA ",
    category: "Bebida sin alcohol",
    price: 185,
    stock: null,
    image:
      chubbyrojo,
  },
  {
    id: 37,
    name: "CHOVI NARANJA ",
    category: "Bebida sin alcohol",
    price: 225,
    stock: null,
    image:
     chubbynaranja,
  },
  {
    id: 38,
    name: "CHOVI FRESCA ",
    category: "Bebida sin alcohol",
    price: 245,
    stock: null,
    image:
     chubbyfresca
  },
  {
    id: 39,
    name: "POWER ROJO ",
    category: "Bebida sin alcohol",
    price: 215,
    stock: null,
    image:
      powerR
  },
  {
    id: 40,
    name: "POWER AZÚL ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
     powerA
  },
  {
    id: 41,
    name: "GATORADE ROJO",
    category: "Bebida sin alcohol",
    price: 245,
    stock: null,
    image:
     gateroR
  },
  {
    id: 42,
    name: "GATORADE AZÚL ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
      gateroA
  },
  {
    id: 43,
    name: "LIPTON LIMON",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
     lipton
  },
  {
    id: 44,
    name: "HICT MANZANA ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
      hci
  },

  {
    id: 45,
    name: "AGUA LITRO  ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
      agualitro
  },
  {
    id: 46,
    name: "AGUA MEDIO LITRO  ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
      aguamedio
  },
  {
    id: 47,
    name: "ENSA PLASTICO  ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
     ensap
  },
  {
    id: 48,
    name: "ENSA VIDRIO ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
      ensav
  },
  {
    id: 49,
    name: "PEPSI VIDRIO ",
    category: "Bebida sin alcohol",
    price: 255,
    stock: null,
    image:
     pepsi
  },
   {
    id: 50,
    name: "NACHOS GRANDE",
   category: "comida",
    price: 255,
    stock: null,
    image:
     nachosG
  },
   {
    id: 51,
    name: "CUBETAZO TOÑA",
   category: "promociones",
    price: 255,
    stock: null,
    bundleItems: [{ productId: 1, quantity: 6 }],
    image:
     cubetazotona
  },
  {
    id: 52,
    name: "CUBETAZO clasica",
   category: "promociones",
    price: 255,
    stock: null,
    bundleItems: [{ productId: 4, quantity: 6 }],
    image:
     cubetazoclasica
  },
  
];

// Mesas dinámicas sin numeración predefinida
export const INITIAL_TABLES = [];
