"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { COMPANY_NAME, WHATSAPP_NUMBER, WAREHOUSE_ADDRESS } from "@/lib/config";

/* ---------------------------------------------------------
   i18n
--------------------------------------------------------- */
const LANGS = {
  en: { label: "English", dir: "ltr" },
  tr: { label: "Türkçe", dir: "ltr" },
  es: { label: "Español", dir: "ltr" },
  fr: { label: "Français", dir: "ltr" },
  zh: { label: "中文", dir: "ltr" },
  ar: { label: "العربية", dir: "rtl" },
};

const T = {
  en: {
    tag: "FBA & FBM PREP CENTER · GREATER TORONTO AREA, CANADA",
    heroTitle1: "Your Amazon & eBay",
    heroTitle2: "prep center in Canada,",
    heroTitle3: "priced in the open.",
    heroSub:
      "FBA prep, FBM/eBay fulfillment, poly-bagging, and kitting from our Greater Toronto Area warehouse. Transparent per-unit and per-order pricing — no vague quotes, no surprise invoices.",
    ctaCalc: "Calculate my price",
    since: "SINCE",
    fromPrice: "FROM",
    unitsHandled: "UNITS HANDLED",
    boxesShipped: "BOXES SHIPPED",
    deliveries: "DELIVERIES DONE",
    servicesTitle: "What we do",
    servicesSub: "We receive, prep, and reship — so your stock moves instead of sitting.",
    svcFBA: "Amazon FBA Prep",
    svcFBAd: "FNSKU labeling, inspection, poly-bagging, carton forwarding to Amazon.ca / .com fulfillment centers.",
    svcFBM: "eBay & FBM Fulfillment",
    svcFBMd: "Pick, pack, and ship direct-to-buyer orders. One warehouse, every marketplace.",
    svcKit: "Kitting & Bundling",
    svcKitd: "Multipacks and bundles built to marketplace standard, quoted before work starts.",
    svcRet: "Removals & Returns",
    svcRetd: "We receive, inspect, relabel, and get sellable units back into your inventory.",
    pricingTitle: "Transparent pricing.",
    pricingTitle2: "Every rate, on one page.",
    pricingSub: "No monthly fee, no retainer. Prep work bills per unit, order fulfillment bills per order. Slide to see your number.",
    modelUnit: "Per unit — FBA / WFS prep",
    modelOrder: "Per order — Shopify / eBay / FBM",
    tierSilver: "Silver",
    tierPlatinum: "Platinum",
    tierDiamond: "Diamond",
    unitsRange1: "1 – 999 units/mo",
    unitsRange2: "1,000 – 4,999 units/mo",
    unitsRange3: "5,000+ units/mo",
    perUnit: "per unit CAD",
    perOrder: "per order CAD",
    monthlyVolume: "Your volume",
    units: "units",
    orders: "orders",
    avgUnitsPerOrder: "Avg. units per order",
    addons: "Add-on services",
    addonLabel: "Labeling",
    addonPoly: "Poly-bagging",
    addonBundle: "Bundling (per set)",
    addonInsert: "Custom insert / thank-you card",
    subtotal: "Subtotal",
    tax: "HST (13%)",
    total: "Estimated monthly total",
    notIncluded: "Not included: carrier shipping/freight (billed separately), storage past 5 days.",
    createOrder: "Create order →",
    trustTitle: "Real humans, transparent numbers.",
    trust1: "No surprise charges",
    trust1d: "You see every line before you pay. A card is only charged for what's on the order.",
    trust2: "Reply within 4 business hours",
    trust2d: "No automated first response. A real person reads your request.",
    trust3: "Bilingual EN / FR / TR",
    trust3d: "We work in the language you're most comfortable in.",
    trust4: "Amazon integration available",
    trust4d: "Connect Seller Central for live stock sync and automatic low-stock alerts. Manual mode also supported.",
    footerNote: "This page is a working demo of the pricing model — final rates confirmed on order.",
    // order flow
    authTitleLogin: "Log in to your account",
    authTitleRegister: "Create your account",
    authSub: "Manage your orders, balance, and shipments from one panel.",
    emailLabel: "Email address",
    passwordLabel: "Password",
    fullNameLabel: "Full name",
    loginBtn: "Log in",
    registerBtn: "Create account",
    toggleToRegister: "Don't have an account? Register",
    toggleToLogin: "Already have an account? Log in",
    integrationQ: "How would you like to send us stock?",
    integrationSub: "You can change this anytime from your panel.",
    integrationAmazon: "Connect Amazon",
    integrationAmazonDesc: "Link Seller Central. We track your live stock and notify you automatically.",
    integrationManual: "Continue manually",
    integrationManualDesc: "Upload your product photo, tell us the quantity and services you need.",
    connectAmazonBtn: "Connect Seller Central",
    connectingAmazon: "Connecting…",
    amazonConnected: "Amazon account connected. We'll sync your stock automatically.",
    continueBtn: "Continue",
    uploadTitle: "Product photo",
    uploadHint: "Add a photo so our team recognizes the product on arrival.",
    chooseFile: "Choose photo",
    orderSummaryTitle: "Order summary",
    payNowBtn: "Pay & confirm order",
    addressTitle: "Order confirmed — here's your prep address",
    addressBody: "Give this address to your supplier or manufacturer so your stock ships directly to us:",
    addressNote: "Include your order number on the shipping label so we match it to your account.",
    whatsappLabel: "Chat with us on WhatsApp",
    backBtn: "← Back",
    closeBtn: "Close",
    orderNumberLabel: "Order #",
    quantityLabel: "Quantity",
  },
  tr: {
    tag: "FBA & FBM PREP MERKEZİ · BÜYÜK TORONTO BÖLGESİ, KANADA",
    heroTitle1: "Amazon ve eBay'iniz için",
    heroTitle2: "Kanada'da prep merkezi,",
    heroTitle3: "şeffaf fiyatlarla.",
    heroSub:
      "FBA prep, FBM/eBay gönderimi, poly bag, kitting — Büyük Toronto Bölgesi'ndeki deponuzdan. Net birim ve sipariş bazlı fiyatlandırma; belirsiz teklif yok, sürpriz fatura yok.",
    ctaCalc: "Fiyatımı hesapla",
    since: "KURULUŞ",
    fromPrice: "BAŞLANGIÇ",
    unitsHandled: "İŞLENEN ÜRÜN",
    boxesShipped: "GÖNDERİLEN KOLİ",
    deliveries: "TAMAMLANAN TESLİMAT",
    servicesTitle: "Ne yapıyoruz",
    servicesSub: "Ürününüzü teslim alır, hazırlar, yeniden göndeririz — stok bekletmez, döner.",
    svcFBA: "Amazon FBA Hazırlık",
    svcFBAd: "FNSKU etiketleme, kontrol, poly bag, Amazon.ca / .com dağıtım merkezlerine yönlendirme.",
    svcFBM: "eBay & FBM Gönderimi",
    svcFBMd: "Alıcıya doğrudan pick-pack-ship. Tek depo, her pazar yeri.",
    svcKit: "Kitting & Bundling",
    svcKitd: "Pazar yeri standardına uygun çoklu paket, işe başlamadan önce fiyatlandırılır.",
    svcRet: "İade & Removal İşlemleri",
    svcRetd: "Teslim alır, kontrol eder, yeniden etiketler, satılabilir ürünü stoğa geri kazandırırız.",
    pricingTitle: "Şeffaf fiyatlandırma.",
    pricingTitle2: "Her ücret, tek sayfada.",
    pricingSub: "Aylık ücret yok, sabit ücret yok. Hazırlık işi birim başına, sipariş gönderimi sipariş başına ücretlenir. Kaydırıp rakamınızı görün.",
    modelUnit: "Birim başına — FBA / WFS prep",
    modelOrder: "Sipariş başına — Shopify / eBay / FBM",
    tierSilver: "Silver",
    tierPlatinum: "Platinum",
    tierDiamond: "Diamond",
    unitsRange1: "1 – 999 ürün/ay",
    unitsRange2: "1.000 – 4.999 ürün/ay",
    unitsRange3: "5.000+ ürün/ay",
    perUnit: "birim başına CAD",
    perOrder: "sipariş başına CAD",
    monthlyVolume: "Hacminiz",
    units: "ürün",
    orders: "sipariş",
    avgUnitsPerOrder: "Sipariş başına ort. ürün",
    addons: "Ek hizmetler",
    addonLabel: "Etiketleme",
    addonPoly: "Poly bag",
    addonBundle: "Bundling (paket başına)",
    addonInsert: "Özel kart / teşekkür kartı",
    subtotal: "Ara toplam",
    tax: "HST (%13)",
    total: "Tahmini aylık toplam",
    notIncluded: "Dahil değil: kargo/navlun (ayrı faturalanır), 5 günü aşan depolama.",
    createOrder: "Sipariş oluştur →",
    trustTitle: "Gerçek insanlar, net rakamlar.",
    trust1: "Sürpriz ücret yok",
    trust1d: "Ödemeden önce her kalemi görürsünüz. Kartınızdan sadece siparişte yazan tutar çekilir.",
    trust2: "4 iş saati içinde yanıt",
    trust2d: "Otomatik ilk yanıt yok. Talebinizi gerçek biri okur.",
    trust3: "İki dilde destek: TR / EN / FR",
    trust3d: "Sizin için en rahat dilde çalışırız.",
    trust4: "Amazon entegrasyonu mevcut",
    trust4d: "Seller Central'ı bağlayın, canlı stok senkronizasyonu ve düşük stok bildirimi alın. Manuel mod da desteklenir.",
    footerNote: "Bu sayfa fiyatlandırma modelinin çalışan bir demosudur — kesin fiyatlar siparişte onaylanır.",
    authTitleLogin: "Hesabınıza giriş yapın",
    authTitleRegister: "Hesap oluşturun",
    authSub: "Siparişlerinizi, bakiyenizi ve gönderilerinizi tek panelden yönetin.",
    emailLabel: "E-posta adresi",
    passwordLabel: "Şifre",
    fullNameLabel: "Ad soyad",
    loginBtn: "Giriş yap",
    registerBtn: "Hesap oluştur",
    toggleToRegister: "Hesabınız yok mu? Kayıt olun",
    toggleToLogin: "Zaten hesabınız var mı? Giriş yapın",
    integrationQ: "Stoğunuzu bize nasıl göndermek istersiniz?",
    integrationSub: "Bunu istediğiniz zaman panelinizden değiştirebilirsiniz.",
    integrationAmazon: "Amazon'u bağla",
    integrationAmazonDesc: "Seller Central'ı bağlayın. Canlı stoğunuzu takip eder, otomatik bildirim göndeririz.",
    integrationManual: "Manuel devam et",
    integrationManualDesc: "Ürün fotoğrafını yükleyin, adet ve istediğiniz hizmetleri belirtin.",
    connectAmazonBtn: "Seller Central'ı Bağla",
    connectingAmazon: "Bağlanıyor…",
    amazonConnected: "Amazon hesabı bağlandı. Stoğunuz otomatik senkronize edilecek.",
    continueBtn: "Devam et",
    uploadTitle: "Ürün fotoğrafı",
    uploadHint: "Ekibimizin varışta ürünü tanıması için bir fotoğraf ekleyin.",
    chooseFile: "Fotoğraf seç",
    orderSummaryTitle: "Sipariş özeti",
    payNowBtn: "Öde ve siparişi onayla",
    addressTitle: "Sipariş onaylandı — prep adresiniz",
    addressBody: "Stoğunuzun doğrudan bize gönderilmesi için bu adresi tedarikçinize veya üreticinize verin:",
    addressNote: "Hesabınızla eşleştirebilmemiz için kargo etiketine sipariş numaranızı yazdırın.",
    whatsappLabel: "WhatsApp'tan bize yazın",
    backBtn: "← Geri",
    closeBtn: "Kapat",
    orderNumberLabel: "Sipariş no",
    quantityLabel: "Adet",
  },
  es: {
    tag: "CENTRO DE PREP FBA Y FBM · ÁREA METROPOLITANA DE TORONTO, CANADÁ",
    heroTitle1: "Tu centro de preparación",
    heroTitle2: "para Amazon y eBay en Canadá,",
    heroTitle3: "con precios transparentes.",
    heroSub:
      "Preparación FBA, cumplimiento FBM/eBay, embolsado y kitting desde nuestro almacén en el área metropolitana de Toronto. Precios claros por unidad y por pedido — sin cotizaciones vagas.",
    ctaCalc: "Calcular mi precio",
    since: "DESDE",
    fromPrice: "DESDE",
    unitsHandled: "UNIDADES PROCESADAS",
    boxesShipped: "CAJAS ENVIADAS",
    deliveries: "ENTREGAS REALIZADAS",
    servicesTitle: "Qué hacemos",
    servicesSub: "Recibimos, preparamos y reenviamos — tu inventario se mueve, no se queda quieto.",
    svcFBA: "Preparación Amazon FBA",
    svcFBAd: "Etiquetado FNSKU, inspección, embolsado y envío a centros de Amazon.ca / .com.",
    svcFBM: "Cumplimiento eBay y FBM",
    svcFBMd: "Recolección, empaque y envío directo al comprador. Un almacén, todos los canales.",
    svcKit: "Kitting y Bundling",
    svcKitd: "Multipacks según estándar del marketplace, cotizados antes de empezar.",
    svcRet: "Devoluciones y Removals",
    svcRetd: "Recibimos, inspeccionamos, re-etiquetamos y devolvemos unidades vendibles al inventario.",
    pricingTitle: "Precios transparentes.",
    pricingTitle2: "Cada tarifa, en una página.",
    pricingSub: "Sin cuota mensual, sin retainer. La preparación se factura por unidad, el envío por pedido. Desliza para ver tu número.",
    modelUnit: "Por unidad — FBA / WFS",
    modelOrder: "Por pedido — Shopify / eBay / FBM",
    tierSilver: "Silver",
    tierPlatinum: "Platinum",
    tierDiamond: "Diamond",
    unitsRange1: "1 – 999 unidades/mes",
    unitsRange2: "1,000 – 4,999 unidades/mes",
    unitsRange3: "5,000+ unidades/mes",
    perUnit: "por unidad CAD",
    perOrder: "por pedido CAD",
    monthlyVolume: "Tu volumen",
    units: "unidades",
    orders: "pedidos",
    avgUnitsPerOrder: "Unidades promedio por pedido",
    addons: "Servicios adicionales",
    addonLabel: "Etiquetado",
    addonPoly: "Embolsado",
    addonBundle: "Bundling (por set)",
    addonInsert: "Tarjeta personalizada",
    subtotal: "Subtotal",
    tax: "HST (13%)",
    total: "Total mensual estimado",
    notIncluded: "No incluido: transporte/flete (facturado aparte), almacenamiento después de 5 días.",
    createOrder: "Crear pedido →",
    trustTitle: "Personas reales, números claros.",
    trust1: "Sin cargos sorpresa",
    trust1d: "Ves cada línea antes de pagar. Solo se cobra lo que aparece en el pedido.",
    trust2: "Respuesta en 4 horas hábiles",
    trust2d: "Sin respuesta automática. Una persona real lee tu solicitud.",
    trust3: "Soporte bilingüe EN / FR / ES",
    trust3d: "Trabajamos en el idioma que prefieras.",
    trust4: "Integración con Amazon disponible",
    trust4d: "Conecta Seller Central para sincronización de stock en vivo y alertas automáticas. Modo manual también disponible.",
    footerNote: "Esta página es una demo funcional del modelo de precios — tarifas finales confirmadas al crear el pedido.",
    authTitleLogin: "Inicia sesión",
    authTitleRegister: "Crea tu cuenta",
    authSub: "Gestiona tus pedidos, saldo y envíos desde un solo panel.",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    fullNameLabel: "Nombre completo",
    loginBtn: "Iniciar sesión",
    registerBtn: "Crear cuenta",
    toggleToRegister: "¿No tienes cuenta? Regístrate",
    toggleToLogin: "¿Ya tienes cuenta? Inicia sesión",
    integrationQ: "¿Cómo quieres enviarnos tu stock?",
    integrationSub: "Puedes cambiar esto en cualquier momento desde tu panel.",
    integrationAmazon: "Conectar Amazon",
    integrationAmazonDesc: "Vincula Seller Central. Rastreamos tu stock en vivo y te avisamos automáticamente.",
    integrationManual: "Continuar manualmente",
    integrationManualDesc: "Sube la foto de tu producto, indica cantidad y servicios que necesitas.",
    connectAmazonBtn: "Conectar Seller Central",
    connectingAmazon: "Conectando…",
    amazonConnected: "Cuenta de Amazon conectada. Sincronizaremos tu stock automáticamente.",
    continueBtn: "Continuar",
    uploadTitle: "Foto del producto",
    uploadHint: "Agrega una foto para que reconozcamos el producto al llegar.",
    chooseFile: "Elegir foto",
    orderSummaryTitle: "Resumen del pedido",
    payNowBtn: "Pagar y confirmar pedido",
    addressTitle: "Pedido confirmado — esta es tu dirección de preparación",
    addressBody: "Entrega esta dirección a tu proveedor o fabricante para que tu stock se envíe directamente a nosotros:",
    addressNote: "Incluye tu número de pedido en la etiqueta de envío para vincularlo a tu cuenta.",
    whatsappLabel: "Escríbenos por WhatsApp",
    backBtn: "← Atrás",
    closeBtn: "Cerrar",
    orderNumberLabel: "Pedido #",
    quantityLabel: "Cantidad",
  },
  fr: {
    tag: "CENTRE DE PRÉPARATION FBA & FBM · GRAND TORONTO, CANADA",
    heroTitle1: "Votre centre de prep",
    heroTitle2: "Amazon et eBay au Canada,",
    heroTitle3: "avec des prix transparents.",
    heroSub:
      "Prep FBA, expédition FBM/eBay, mise en sachet et kitting depuis notre entrepôt du Grand Toronto. Tarification claire par unité et par commande — aucune estimation vague.",
    ctaCalc: "Calculer mon prix",
    since: "DEPUIS",
    fromPrice: "À PARTIR DE",
    unitsHandled: "UNITÉS TRAITÉES",
    boxesShipped: "BOÎTES EXPÉDIÉES",
    deliveries: "LIVRAISONS EFFECTUÉES",
    servicesTitle: "Ce que nous faisons",
    servicesSub: "Nous recevons, préparons et réexpédions — votre stock circule au lieu de dormir.",
    svcFBA: "Préparation Amazon FBA",
    svcFBAd: "Étiquetage FNSKU, inspection, mise en sachet, acheminement vers les centres Amazon.ca / .com.",
    svcFBM: "Expédition eBay et FBM",
    svcFBMd: "Cueillette, emballage et expédition directe à l'acheteur. Un entrepôt, tous les canaux.",
    svcKit: "Kitting et Bundling",
    svcKitd: "Multipacks conformes aux normes des places de marché, chiffrés avant le début des travaux.",
    svcRet: "Retours et Removals",
    svcRetd: "Réception, inspection, ré-étiquetage et remise en stock des unités vendables.",
    pricingTitle: "Tarification transparente.",
    pricingTitle2: "Chaque tarif, sur une seule page.",
    pricingSub: "Aucuns frais mensuels, aucun forfait minimum. La préparation est facturée à l'unité, l'expédition par commande. Glissez pour voir votre montant.",
    modelUnit: "Par unité — FBA / WFS",
    modelOrder: "Par commande — Shopify / eBay / FBM",
    tierSilver: "Silver",
    tierPlatinum: "Platinum",
    tierDiamond: "Diamond",
    unitsRange1: "1 à 999 unités/mois",
    unitsRange2: "1 000 à 4 999 unités/mois",
    unitsRange3: "5 000+ unités/mois",
    perUnit: "par unité CAD",
    perOrder: "par commande CAD",
    monthlyVolume: "Votre volume",
    units: "unités",
    orders: "commandes",
    avgUnitsPerOrder: "Unités moy. par commande",
    addons: "Services additionnels",
    addonLabel: "Étiquetage",
    addonPoly: "Mise en sachet",
    addonBundle: "Bundling (par lot)",
    addonInsert: "Carte personnalisée",
    subtotal: "Sous-total",
    tax: "TVH (13 %)",
    total: "Total mensuel estimé",
    notIncluded: "Non inclus : transport/fret (facturé séparément), entreposage au-delà de 5 jours.",
    createOrder: "Créer la commande →",
    trustTitle: "De vraies personnes, des chiffres clairs.",
    trust1: "Aucuns frais surprises",
    trust1d: "Vous voyez chaque ligne avant de payer. Seul le montant de la commande est débité.",
    trust2: "Réponse sous 4 heures ouvrables",
    trust2d: "Aucune réponse automatisée. Une vraie personne lit votre demande.",
    trust3: "Support bilingue EN / FR / TR",
    trust3d: "Nous travaillons dans la langue de votre choix.",
    trust4: "Intégration Amazon disponible",
    trust4d: "Connectez Seller Central pour la synchronisation du stock en direct et les alertes automatiques. Mode manuel aussi disponible.",
    footerNote: "Cette page est une démo fonctionnelle du modèle de tarification — tarifs finaux confirmés à la commande.",
    authTitleLogin: "Connectez-vous",
    authTitleRegister: "Créez votre compte",
    authSub: "Gérez vos commandes, votre solde et vos expéditions depuis un seul panneau.",
    emailLabel: "Adresse courriel",
    passwordLabel: "Mot de passe",
    fullNameLabel: "Nom complet",
    loginBtn: "Se connecter",
    registerBtn: "Créer le compte",
    toggleToRegister: "Pas de compte ? Inscrivez-vous",
    toggleToLogin: "Déjà un compte ? Connectez-vous",
    integrationQ: "Comment souhaitez-vous nous envoyer votre stock ?",
    integrationSub: "Vous pouvez changer cela à tout moment depuis votre panneau.",
    integrationAmazon: "Connecter Amazon",
    integrationAmazonDesc: "Liez Seller Central. Nous suivons votre stock en direct et vous alertons automatiquement.",
    integrationManual: "Continuer manuellement",
    integrationManualDesc: "Téléversez la photo du produit, indiquez la quantité et les services voulus.",
    connectAmazonBtn: "Connecter Seller Central",
    connectingAmazon: "Connexion…",
    amazonConnected: "Compte Amazon connecté. Votre stock sera synchronisé automatiquement.",
    continueBtn: "Continuer",
    uploadTitle: "Photo du produit",
    uploadHint: "Ajoutez une photo pour que notre équipe reconnaisse le produit à l'arrivée.",
    chooseFile: "Choisir une photo",
    orderSummaryTitle: "Résumé de la commande",
    payNowBtn: "Payer et confirmer la commande",
    addressTitle: "Commande confirmée — voici votre adresse de préparation",
    addressBody: "Donnez cette adresse à votre fournisseur ou fabricant pour que votre stock nous soit expédié directement :",
    addressNote: "Indiquez votre numéro de commande sur l'étiquette d'expédition pour le rattacher à votre compte.",
    whatsappLabel: "Écrivez-nous sur WhatsApp",
    backBtn: "← Retour",
    closeBtn: "Fermer",
    orderNumberLabel: "Commande n°",
    quantityLabel: "Quantité",
  },
  zh: {
    tag: "FBA & FBM 备货中心 · 加拿大大多伦多地区",
    heroTitle1: "您的亚马逊与 eBay",
    heroTitle2: "加拿大备货中心，",
    heroTitle3: "价格全透明。",
    heroSub:
      "FBA 备货、FBM/eBay 发货、装袋、套装组合，全部来自大多伦多地区仓库。按件与按订单计价清晰透明——没有模糊报价，没有意外账单。",
    ctaCalc: "计算我的费用",
    since: "成立于",
    fromPrice: "起价",
    unitsHandled: "已处理件数",
    boxesShipped: "已发箱数",
    deliveries: "已完成配送",
    servicesTitle: "我们提供的服务",
    servicesSub: "我们负责接收、准备、再发货——让您的库存流动起来，而不是积压。",
    svcFBA: "亚马逊 FBA 备货",
    svcFBAd: "FNSKU 贴标、检验、装袋，转运至 Amazon.ca / .com 配送中心。",
    svcFBM: "eBay 与 FBM 发货",
    svcFBMd: "拣货、打包、直发买家。一个仓库，覆盖所有渠道。",
    svcKit: "套装与组合装",
    svcKitd: "按平台标准制作多件套装，开工前先报价。",
    svcRet: "退货与移除订单",
    svcRetd: "接收、检验、重新贴标，将可售商品重新入库。",
    pricingTitle: "透明定价。",
    pricingTitle2: "所有费率，一目了然。",
    pricingSub: "无月费，无最低消费。备货按件计费，发货按订单计费。拖动滑块查看您的费用。",
    modelUnit: "按件计价 — FBA / WFS",
    modelOrder: "按订单计价 — Shopify / eBay / FBM",
    tierSilver: "白银",
    tierPlatinum: "铂金",
    tierDiamond: "钻石",
    unitsRange1: "每月 1–999 件",
    unitsRange2: "每月 1,000–4,999 件",
    unitsRange3: "每月 5,000+ 件",
    perUnit: "每件（加元）",
    perOrder: "每单（加元）",
    monthlyVolume: "您的数量",
    units: "件",
    orders: "订单",
    avgUnitsPerOrder: "每单平均件数",
    addons: "附加服务",
    addonLabel: "贴标",
    addonPoly: "装袋",
    addonBundle: "组合装（每套）",
    addonInsert: "定制卡片/感谢卡",
    subtotal: "小计",
    tax: "HST（13%）",
    total: "预估月度总额",
    notIncluded: "不含：承运商运费（单独计费）、超过5天的仓储费。",
    createOrder: "创建订单 →",
    trustTitle: "真实的人，透明的数字。",
    trust1: "无意外费用",
    trust1d: "付款前您可查看每一项费用，只会收取订单上显示的金额。",
    trust2: "4个工作小时内回复",
    trust2d: "没有自动回复，真人查看您的请求。",
    trust3: "支持双语 EN / FR / TR",
    trust3d: "我们使用您最方便的语言沟通。",
    trust4: "支持亚马逊集成",
    trust4d: "连接 Seller Central 获取实时库存同步与低库存提醒；也支持手动模式。",
    footerNote: "本页面是定价模型的可运行演示——最终价格以订单确认为准。",
    authTitleLogin: "登录您的账户",
    authTitleRegister: "创建账户",
    authSub: "在一个面板中管理您的订单、余额和货件。",
    emailLabel: "电子邮箱",
    passwordLabel: "密码",
    fullNameLabel: "姓名",
    loginBtn: "登录",
    registerBtn: "创建账户",
    toggleToRegister: "还没有账户？注册",
    toggleToLogin: "已有账户？登录",
    integrationQ: "您希望如何向我们发送库存？",
    integrationSub: "您可以随时在面板中更改此设置。",
    integrationAmazon: "连接亚马逊",
    integrationAmazonDesc: "关联 Seller Central，我们将实时追踪库存并自动通知您。",
    integrationManual: "手动继续",
    integrationManualDesc: "上传产品照片，告知我们数量和所需服务。",
    connectAmazonBtn: "连接 Seller Central",
    connectingAmazon: "连接中…",
    amazonConnected: "亚马逊账户已连接，库存将自动同步。",
    continueBtn: "继续",
    uploadTitle: "产品照片",
    uploadHint: "添加照片以便我们团队在到货时识别产品。",
    chooseFile: "选择照片",
    orderSummaryTitle: "订单摘要",
    payNowBtn: "付款并确认订单",
    addressTitle: "订单已确认 — 这是您的备货地址",
    addressBody: "请将此地址提供给您的供应商或制造商，以便库存直接发往我们：",
    addressNote: "请在快递标签上注明订单号，以便与您的账户匹配。",
    whatsappLabel: "通过 WhatsApp 联系我们",
    backBtn: "← 返回",
    closeBtn: "关闭",
    orderNumberLabel: "订单号",
    quantityLabel: "数量",
  },
  ar: {
    tag: "مركز تجهيز FBA و FBM · منطقة تورونتو الكبرى، كندا",
    heroTitle1: "مركز التجهيز الخاص بك",
    heroTitle2: "لأمازون وإيباي في كندا،",
    heroTitle3: "بأسعار شفافة بالكامل.",
    heroSub:
      "تجهيز FBA، تنفيذ طلبات FBM/eBay، التغليف بالأكياس، والتجميع — كل ذلك من مستودعنا في منطقة تورونتو الكبرى. تسعير واضح لكل وحدة ولكل طلب، دون عروض أسعار غامضة.",
    ctaCalc: "احسب سعري",
    since: "منذ",
    fromPrice: "يبدأ من",
    unitsHandled: "الوحدات المُعالجة",
    boxesShipped: "الصناديق المُشحونة",
    deliveries: "عمليات التسليم المنجزة",
    servicesTitle: "ما الذي نقدمه",
    servicesSub: "نستلم، نُجهّز، ونعيد الشحن — بحيث يتحرك مخزونك بدل أن يتكدس.",
    svcFBA: "تجهيز أمازون FBA",
    svcFBAd: "وضع ملصقات FNSKU، الفحص، التغليف، وإعادة التوجيه إلى مراكز Amazon.ca / .com.",
    svcFBM: "تنفيذ طلبات eBay و FBM",
    svcFBMd: "التقاط وتغليف وشحن مباشر للمشتري. مستودع واحد، جميع القنوات.",
    svcKit: "التجميع والحزم",
    svcKitd: "عبوات متعددة وفق معايير المنصة، مع تسعير قبل بدء العمل.",
    svcRet: "المرتجعات وطلبات الإزالة",
    svcRetd: "نستلم، نفحص، نعيد وضع الملصقات، ونعيد الوحدات القابلة للبيع إلى المخزون.",
    pricingTitle: "تسعير شفاف بالكامل.",
    pricingTitle2: "كل الأسعار في صفحة واحدة.",
    pricingSub: "بدون رسوم شهرية، بدون حد أدنى. يُحتسب التجهيز لكل وحدة، ويُحتسب الشحن لكل طلب. حرّك الشريط لرؤية رقمك.",
    modelUnit: "لكل وحدة — FBA / WFS",
    modelOrder: "لكل طلب — Shopify / eBay / FBM",
    tierSilver: "فضي",
    tierPlatinum: "بلاتيني",
    tierDiamond: "ماسي",
    unitsRange1: "1 – 999 وحدة/شهر",
    unitsRange2: "1,000 – 4,999 وحدة/شهر",
    unitsRange3: "5,000+ وحدة/شهر",
    perUnit: "لكل وحدة (دولار كندي)",
    perOrder: "لكل طلب (دولار كندي)",
    monthlyVolume: "حجمك",
    units: "وحدة",
    orders: "طلب",
    avgUnitsPerOrder: "متوسط الوحدات لكل طلب",
    addons: "خدمات إضافية",
    addonLabel: "وضع الملصقات",
    addonPoly: "التغليف بالأكياس",
    addonBundle: "التجميع (لكل مجموعة)",
    addonInsert: "بطاقة مخصصة / شكر",
    subtotal: "المجموع الفرعي",
    tax: "ضريبة HST (13%)",
    total: "الإجمالي الشهري المقدّر",
    notIncluded: "غير مشمول: الشحن (يُحتسب بشكل منفصل)، التخزين بعد 5 أيام.",
    createOrder: "إنشاء الطلب ←",
    trustTitle: "أشخاص حقيقيون، أرقام واضحة.",
    trust1: "لا رسوم مفاجئة",
    trust1d: "تشاهد كل بند قبل الدفع. لا يُخصم من بطاقتك سوى المبلغ الظاهر في الطلب.",
    trust2: "الرد خلال 4 ساعات عمل",
    trust2d: "لا رد آلي. شخص حقيقي يقرأ طلبك.",
    trust3: "دعم متعدد اللغات EN / FR / TR",
    trust3d: "نعمل باللغة الأنسب لك.",
    trust4: "التكامل مع أمازون متاح",
    trust4d: "اربط Seller Central لمزامنة المخزون الحي والتنبيهات التلقائية. الوضع اليدوي متاح أيضاً.",
    footerNote: "هذه الصفحة عرض توضيحي عملي لنموذج التسعير — الأسعار النهائية تُؤكد عند إنشاء الطلب.",
    authTitleLogin: "سجّل الدخول إلى حسابك",
    authTitleRegister: "أنشئ حسابك",
    authSub: "أدر طلباتك ورصيدك وشحناتك من لوحة واحدة.",
    emailLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    fullNameLabel: "الاسم الكامل",
    loginBtn: "تسجيل الدخول",
    registerBtn: "إنشاء حساب",
    toggleToRegister: "ليس لديك حساب؟ سجّل",
    toggleToLogin: "لديك حساب بالفعل؟ سجّل الدخول",
    integrationQ: "كيف تود إرسال مخزونك إلينا؟",
    integrationSub: "يمكنك تغيير هذا في أي وقت من لوحتك.",
    integrationAmazon: "ربط أمازون",
    integrationAmazonDesc: "اربط Seller Central. نتابع مخزونك الحي ونُنبّهك تلقائياً.",
    integrationManual: "المتابعة يدوياً",
    integrationManualDesc: "ارفع صورة المنتج، وحدد الكمية والخدمات التي تحتاجها.",
    connectAmazonBtn: "ربط Seller Central",
    connectingAmazon: "جارٍ الربط…",
    amazonConnected: "تم ربط حساب أمازون. سنقوم بمزامنة مخزونك تلقائياً.",
    continueBtn: "متابعة",
    uploadTitle: "صورة المنتج",
    uploadHint: "أضف صورة ليتعرف فريقنا على المنتج عند الوصول.",
    chooseFile: "اختر صورة",
    orderSummaryTitle: "ملخص الطلب",
    payNowBtn: "ادفع وأكّد الطلب",
    addressTitle: "تم تأكيد الطلب — إليك عنوان التجهيز الخاص بك",
    addressBody: "أعطِ هذا العنوان لموردك أو المصنّع ليتم شحن مخزونك إلينا مباشرة:",
    addressNote: "أضف رقم طلبك على ملصق الشحن حتى نطابقه مع حسابك.",
    whatsappLabel: "راسلنا عبر واتساب",
    backBtn: "← رجوع",
    closeBtn: "إغلاق",
    orderNumberLabel: "رقم الطلب",
    quantityLabel: "الكمية",
  },
};

/* ---------------------------------------------------------
   Pricing model
--------------------------------------------------------- */
function unitTier(units: number) {
  if (units >= 5000) return { key: "diamond", rate: 0.62 };
  if (units >= 1000) return { key: "platinum", rate: 0.78 };
  return { key: "silver", rate: 0.95 };
}
function orderTier(orders: number) {
  if (orders >= 5000) return { key: "diamond", rate: 1.1 };
  if (orders >= 1000) return { key: "platinum", rate: 1.45 };
  return { key: "silver", rate: 1.75 };
}
const TIER_META: Record<string, { color: string; glow: string }> = {
  silver: { color: "#c9ccd1", glow: "rgba(201,204,209,0.35)" },
  platinum: { color: "#8fb8ff", glow: "rgba(143,184,255,0.35)" },
  diamond: { color: "#7be6d8", glow: "rgba(123,230,216,0.4)" },
};
const POLY_RATE = 0.6;
const BUNDLE_RATE = 0.75;
const INSERT_RATE = 0.15;
const EXTRA_UNIT_RATE = 0.25;

type LangKey = "en" | "tr" | "es" | "fr" | "zh" | "ar";

function detectLang(): LangKey {
  try {
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("tr")) return "tr";
    if (nav.startsWith("es")) return "es";
    if (nav.startsWith("fr")) return "fr";
    if (nav.startsWith("zh")) return "zh";
    if (nav.startsWith("ar")) return "ar";
    return "en";
  } catch {
    return "en";
  }
}

export default function FoxPrepLanding() {
  const [lang, setLang] = useState<LangKey>("en");
  useEffect(() => setLang(detectLang()), []);
  const t = T[lang];
  const dir = LANGS[lang].dir;
  const calcRef = useRef<HTMLDivElement>(null);

  const [model, setModel] = useState("unit");
  const [units, setUnits] = useState(600);
  const [orders, setOrders] = useState(400);
  const [avgUnitsPerOrder, setAvgUnitsPerOrder] = useState(1.2);
  const [addonPoly, setAddonPoly] = useState(0);
  const [addonBundle, setAddonBundle] = useState(0);
  const [addonInsert, setAddonInsert] = useState(0);

  const calc = useMemo(() => {
    if (model === "unit") {
      const tier = unitTier(units);
      const base = units * tier.rate;
      const poly = addonPoly * POLY_RATE;
      const bundle = addonBundle * BUNDLE_RATE;
      const insert = addonInsert * INSERT_RATE;
      const subtotal = base + poly + bundle + insert;
      const tax = subtotal * 0.13;
      return { tier, base, extra: 0, poly, bundle, insert, subtotal, tax, total: subtotal + tax };
    } else {
      const tier = orderTier(orders);
      const base = orders * tier.rate;
      const extraUnits = Math.max(0, avgUnitsPerOrder - 1) * orders;
      const extra = extraUnits * EXTRA_UNIT_RATE;
      const poly = addonPoly * POLY_RATE;
      const bundle = addonBundle * BUNDLE_RATE;
      const insert = addonInsert * INSERT_RATE;
      const subtotal = base + extra + poly + bundle + insert;
      const tax = subtotal * 0.13;
      return { tier, base, extra, poly, bundle, insert, subtotal, tax, total: subtotal + tax };
    }
  }, [model, units, orders, avgUnitsPerOrder, addonPoly, addonBundle, addonInsert]);

  const fmt = (n: number) =>
    n.toLocaleString(lang === "zh" ? "zh-CN" : lang === "ar" ? "ar-EG" : lang, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    });


  return (
    <div dir={dir} style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#0b0d10", color: "#eef0f2", minHeight: "100vh" }}>
      <GlobalStyle />

      {/* NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1e24" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#e88b3c,#c2571a)", flexShrink: 0 }} />
          <span className="display" style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.5 }}>{COMPANY_NAME}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/login" style={{ fontSize: 13, color: "#c7cbd1", textDecoration: "none" }}>Log in</Link>
          <select value={lang} onChange={(e) => setLang(e.target.value as LangKey)} style={{ background: "#14171b", color: "#eef0f2", border: "1px solid #262b31", borderRadius: 8, padding: "6px 8px", fontSize: 12.5 }}>
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* HERO */}
      <div className="page-pad" style={{ padding: "56px 20px 48px", maxWidth: 1080, margin: "0 auto" }}>
        <div className="fade-in" style={{ display: "inline-block", fontSize: 11.5, letterSpacing: 1.2, color: "#e88b3c", fontWeight: 700, marginBottom: 18, border: "1px solid #3a2a1a", padding: "6px 12px", borderRadius: 999, background: "#1a140d" }}>
          {t.tag}
        </div>
        <h1 className="display fade-in hero-h1" style={{ lineHeight: 1.08, fontWeight: 800, letterSpacing: -1, margin: "0 0 20px" }}>
          {t.heroTitle1}<br />{t.heroTitle2}<br /><span style={{ color: "#7be6d8" }}>{t.heroTitle3}</span>
        </h1>
        <p className="fade-in" style={{ fontSize: 16, lineHeight: 1.6, color: "#9aa2ab", maxWidth: 620, marginBottom: 28 }}>{t.heroSub}</p>
        <button
          onClick={() => calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          style={{ background: "#e88b3c", color: "#161207", border: "none", padding: "14px 22px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 44 }}
        >
          {t.ctaCalc}
        </button>
        <div className="stat-grid" style={{ borderTop: "1px solid #1a1e24", paddingTop: 26 }}>
          {[[t.since, "2018"], [t.fromPrice, fmt(0.62).replace(/\.00$/, "")], [t.unitsHandled, "1.4M+"], [t.boxesShipped, "210K+"], [t.deliveries, "180K+"]].map(([label, val]) => (
            <div key={label}>
              <div className="display" style={{ fontSize: 24, fontWeight: 700, color: "#7be6d8" }}>{val}</div>
              <div style={{ fontSize: 10.5, letterSpacing: 0.8, color: "#6b7280", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERVICES */}
      <div className="page-pad" style={{ padding: "10px 20px 56px", maxWidth: 1080, margin: "0 auto" }}>
        <h2 className="display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{t.servicesTitle}</h2>
        <p style={{ color: "#9aa2ab", marginBottom: 24, fontSize: 14.5 }}>{t.servicesSub}</p>
        <div className="svc-grid">
          {[[t.svcFBA, t.svcFBAd, "📦"], [t.svcFBM, t.svcFBMd, "🚚"], [t.svcKit, t.svcKitd, "🧩"], [t.svcRet, t.svcRetd, "↩️"]].map(([title, desc, icon]) => (
            <div key={title} className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14.5 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#9aa2ab", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div ref={calcRef} className="page-pad" style={{ padding: "10px 20px 36px", maxWidth: 1080, margin: "0 auto", scrollMarginTop: 20 }}>
        <h2 className="display" style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{t.pricingTitle}</h2>
        <h3 className="display" style={{ fontSize: 19, fontWeight: 600, color: "#e88b3c", marginBottom: 12 }}>{t.pricingTitle2}</h3>
        <p style={{ color: "#9aa2ab", marginBottom: 24, maxWidth: 600, fontSize: 14.5 }}>{t.pricingSub}</p>

        <div className="tier-grid" style={{ marginBottom: 28 }}>
          {[
            { key: "silver", label: t.tierSilver, range: model === "unit" ? t.unitsRange1 : t.unitsRange1.replace("units", "orders"), rate: model === "unit" ? 0.95 : 1.75 },
            { key: "platinum", label: t.tierPlatinum, range: model === "unit" ? t.unitsRange2 : t.unitsRange2.replace("units", "orders"), rate: model === "unit" ? 0.78 : 1.45 },
            { key: "diamond", label: t.tierDiamond, range: model === "unit" ? t.unitsRange3 : t.unitsRange3.replace("units", "orders"), rate: model === "unit" ? 0.62 : 1.1 },
          ].map((tier) => {
            const active = calc.tier.key === tier.key;
            const meta = TIER_META[tier.key];
            return (
              <div key={tier.key} className="card" style={{ padding: 18, borderColor: active ? meta.color : "#1f242b", boxShadow: active ? `0 0 0 1px ${meta.color}, 0 0 24px ${meta.glow}` : "none" }}>
                <div style={{ fontSize: 11, letterSpacing: 1.2, color: meta.color, fontWeight: 700, marginBottom: 8 }}>{tier.label.toUpperCase()}</div>
                <div style={{ fontSize: 12.5, color: "#9aa2ab", marginBottom: 12 }}>{tier.range}</div>
                <div className="display" style={{ fontSize: 26, fontWeight: 800 }}>
                  {fmt(tier.rate)}<span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}> /{model === "unit" ? t.perUnit : t.perOrder}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card calc-card" style={{ padding: 22 }}>
          <div className="calc-grid">
            <div>
              <div className="model-toggle">
                <button onClick={() => setModel("unit")} className={"toggle-btn" + (model === "unit" ? " active" : "")}>{t.modelUnit}</button>
                <button onClick={() => setModel("order")} className={"toggle-btn" + (model === "order" ? " active" : "")}>{t.modelOrder}</button>
              </div>

              {model === "unit" ? (
                <>
                  <label className="field-label">{t.monthlyVolume}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 4px" }}>
                    <input type="number" value={units} onChange={(e) => setUnits(Math.max(0, +e.target.value))} style={{ width: 100 }} />
                    <span style={{ fontSize: 12.5, color: "#6b7280" }}>{t.units}</span>
                  </div>
                  <input type="range" min={1} max={10000} value={units} onChange={(e) => setUnits(+e.target.value)} style={{ marginTop: 8 }} />
                </>
              ) : (
                <>
                  <label className="field-label">{t.monthlyVolume}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 4px" }}>
                    <input type="number" value={orders} onChange={(e) => setOrders(Math.max(0, +e.target.value))} style={{ width: 100 }} />
                    <span style={{ fontSize: 12.5, color: "#6b7280" }}>{t.orders}</span>
                  </div>
                  <input type="range" min={1} max={10000} value={orders} onChange={(e) => setOrders(+e.target.value)} style={{ marginTop: 8 }} />
                  <label className="field-label" style={{ display: "block", marginTop: 20 }}>{t.avgUnitsPerOrder}</label>
                  <input type="number" step="0.1" value={avgUnitsPerOrder} onChange={(e) => setAvgUnitsPerOrder(Math.max(1, +e.target.value))} style={{ width: 100, marginTop: 8 }} />
                </>
              )}

              <div className="field-label" style={{ marginTop: 22, marginBottom: 10 }}>{t.addons.toUpperCase()}</div>
              <div className="addon-grid">
                <span>{t.addonPoly} <span style={{ color: "#6b7280" }}>({fmt(POLY_RATE)})</span></span>
                <input type="number" min={0} value={addonPoly} onChange={(e) => setAddonPoly(Math.max(0, +e.target.value))} />
                <span>{t.addonBundle} <span style={{ color: "#6b7280" }}>({fmt(BUNDLE_RATE)})</span></span>
                <input type="number" min={0} value={addonBundle} onChange={(e) => setAddonBundle(Math.max(0, +e.target.value))} />
                <span>{t.addonInsert} <span style={{ color: "#6b7280" }}>({fmt(INSERT_RATE)})</span></span>
                <input type="number" min={0} value={addonInsert} onChange={(e) => setAddonInsert(Math.max(0, +e.target.value))} />
              </div>
            </div>

            <div className="calc-result">
              <div style={{ fontSize: 11, letterSpacing: 1.2, color: TIER_META[calc.tier.key].color, fontWeight: 700, marginBottom: 6 }}>
                {(t as any)["tier" + calc.tier.key[0].toUpperCase() + calc.tier.key.slice(1)]}
              </div>
              <div style={{ display: "grid", gap: 7, fontSize: 13, color: "#c7cbd1", marginBottom: 12 }}>
                {model === "unit" ? (
                  <>
                    <Row label={`${units} ${t.units} × ${fmt(calc.tier.rate)}`} val={fmt(calc.base)} />
                    {addonPoly > 0 && <Row label={`${addonPoly} × ${t.addonPoly}`} val={fmt(calc.poly)} />}
                    {addonBundle > 0 && <Row label={`${addonBundle} × ${t.addonBundle}`} val={fmt(calc.bundle)} />}
                    {addonInsert > 0 && <Row label={`${addonInsert} × ${t.addonInsert}`} val={fmt(calc.insert)} />}
                  </>
                ) : (
                  <>
                    <Row label={`${orders} ${t.orders} × ${fmt(calc.tier.rate)}`} val={fmt(calc.base)} />
                    {calc.extra > 0 && <Row label={t.avgUnitsPerOrder} val={fmt(calc.extra)} />}
                    {addonPoly > 0 && <Row label={`${addonPoly} × ${t.addonPoly}`} val={fmt(calc.poly)} />}
                    {addonBundle > 0 && <Row label={`${addonBundle} × ${t.addonBundle}`} val={fmt(calc.bundle)} />}
                    {addonInsert > 0 && <Row label={`${addonInsert} × ${t.addonInsert}`} val={fmt(calc.insert)} />}
                  </>
                )}
                <Row label={t.subtotal} val={fmt(calc.subtotal)} bold />
                <Row label={t.tax} val={fmt(calc.tax)} />
              </div>
              <div style={{ borderTop: "1px solid #1f242b", paddingTop: 14, marginTop: 2 }}>
                <div className="field-label" style={{ marginBottom: 6 }}>{t.total.toUpperCase()}</div>
                <div className="display total-num" style={{ fontWeight: 800, color: "#e88b3c" }}>{fmt(calc.total)}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10, lineHeight: 1.5 }}>{t.notIncluded}</div>
                <Link href="/register" style={{ marginTop: 16, display: "block", textAlign: "center", width: "100%", background: "#e88b3c", color: "#161207", border: "none", padding: "13px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none" }}>
                  {t.createOrder}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST */}
      <div className="page-pad" style={{ padding: "10px 20px 90px", maxWidth: 1080, margin: "0 auto" }}>
        <h2 className="display" style={{ fontSize: 23, fontWeight: 700, marginBottom: 20 }}>{t.trustTitle}</h2>
        <div className="svc-grid">
          {[[t.trust1, t.trust1d], [t.trust2, t.trust2d], [t.trust3, t.trust3d], [t.trust4, t.trust4d]].map(([title, desc]) => (
            <div key={title} className="card" style={{ padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#9aa2ab", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36, fontSize: 11, color: "#565c64", textAlign: "center" }}>
          {WAREHOUSE_ADDRESS.line1} · {WAREHOUSE_ADDRESS.line2}, {WAREHOUSE_ADDRESS.line3}
        </div>
      </div>

      {/* WHATSAPP FLOATING BUTTON — always visible */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noreferrer"
        className="wa-fab"
        title={t.whatsappLabel}
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
}

function Row({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontWeight: bold ? 700 : 400, color: bold ? "#eef0f2" : "#c7cbd1" }}>
      <span>{label}</span>
      <span style={{ whiteSpace: "nowrap" }}>{val}</span>
    </div>
  );
}

function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path fill="#fff" d="M17.6 6.32A7.85 7.85 0 0 0 4.2 15.8L3 21l5.35-1.4a7.85 7.85 0 0 0 3.66.93h.01a7.85 7.85 0 0 0 5.58-13.2ZM12 20.02h-.01a6.5 6.5 0 0 1-3.31-.91l-.24-.14-2.83.74.76-2.76-.15-.28A6.53 6.53 0 1 1 12 20.02Zm3.6-4.9c-.2-.1-1.16-.57-1.34-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.61.77-.11.13-.23.14-.42.05-.2-.1-.83-.3-1.58-.98a5.9 5.9 0 0 1-1.1-1.36c-.11-.2 0-.3.09-.4.09-.09.2-.23.3-.34.1-.11.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.33h-.37c-.13 0-.35.05-.53.25s-.7.68-.7 1.66.72 1.94.82 2.07c.1.13 1.42 2.17 3.44 3.04.48.21.86.33 1.15.42.48.15.92.13 1.27.08.39-.06 1.16-.47 1.32-.93.16-.46.16-.85.11-.93-.05-.08-.18-.13-.38-.23Z"/>
    </svg>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap');
      * { box-sizing: border-box; }
      .display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
      .fade-in { animation: fadeIn .6s ease both; }
      @keyframes fadeIn { from { opacity:0; transform: translateY(8px);} to {opacity:1; transform:none;} }
      input[type=range] { -webkit-appearance: none; width:100%; height:6px; border-radius:3px; background:#242a31; outline:none; }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:#e88b3c; cursor:pointer; box-shadow:0 0 0 4px rgba(232,139,60,0.18); }
      input[type=number], input[type=email], input[type=password], input[type=text] { background:#14171b; border:1px solid #262b31; color:#eef0f2; border-radius:8px; padding:9px 11px; width:100%; font-size:14px; }
      .card { background:#12151a; border:1px solid #1f242b; border-radius:16px; }
      .hero-h1 { font-size: 30px; }
      @media (min-width:520px){ .hero-h1{ font-size:40px; } }
      @media (min-width:860px){ .hero-h1{ font-size:56px; } }
      .stat-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:16px; }
      @media (min-width:600px){ .stat-grid{ grid-template-columns: repeat(3,1fr);} }
      @media (min-width:860px){ .stat-grid{ grid-template-columns: repeat(5,1fr);} }
      .svc-grid { display:grid; grid-template-columns: 1fr; gap:14px; }
      @media (min-width:560px){ .svc-grid{ grid-template-columns: repeat(2,1fr);} }
      @media (min-width:900px){ .svc-grid{ grid-template-columns: repeat(4,1fr);} }
      .tier-grid { display:grid; grid-template-columns: 1fr; gap:14px; }
      @media (min-width:640px){ .tier-grid{ grid-template-columns: repeat(3,1fr);} }
      .calc-grid { display:grid; grid-template-columns: 1fr; gap:24px; }
      @media (min-width:760px){ .calc-grid{ grid-template-columns: 1.1fr 0.9fr; gap:32px; } .calc-result{ border-inline-start:1px solid #1f242b; padding-inline-start:26px; } }
      .calc-result { border-top: 1px solid #1f242b; padding-top: 20px; }
      @media (min-width:760px){ .calc-result{ border-top:none; padding-top:0; } }
      .total-num { font-size: 30px; }
      @media (min-width:760px){ .total-num{ font-size:34px; } }
      .model-toggle { display:flex; gap:8px; margin-bottom: 20px; flex-wrap: wrap; }
      .toggle-btn { flex:1; min-width: 140px; padding:10px 12px; border-radius:10px; font-size:12.5px; font-weight:600; cursor:pointer; background:#181b20; color:#c7cbd1; border:1px solid #262b31; }
      .toggle-btn.active { background:#e88b3c; color:#161207; border-color:#e88b3c; }
      .field-label { font-size:11px; letter-spacing:0.8px; color:#9aa2ab; font-weight:600; }
      .addon-grid { display:grid; grid-template-columns: 1fr 84px; gap:10px 12px; align-items:center; font-size:13px; }
      .page-pad { }
      .wa-fab { position: fixed; bottom: 20px; right: 20px; width: 54px; height: 54px; border-radius: 50%; background: #25D366; display:flex; align-items:center; justify-content:center; box-shadow: 0 6px 20px rgba(37,211,102,0.45); z-index: 60; }
      [dir="rtl"] .wa-fab { right: auto; left: 20px; }
      .flow-overlay { position: fixed; inset: 0; background: rgba(4,5,7,0.72); backdrop-filter: blur(4px); display:flex; align-items:flex-end; justify-content:center; z-index:70; }
      @media (min-width:640px){ .flow-overlay{ align-items:center; padding:20px; } }
      .flow-panel { background:#12151a; border:1px solid #232830; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; border-radius:20px 20px 0 0; }
      @media (min-width:640px){ .flow-panel{ border-radius:20px; } }
      .flow-header { display:flex; align-items:center; padding: 14px 18px; border-bottom:1px solid #1f242b; position: sticky; top:0; background:#12151a; }
      .flow-body { padding: 20px; }
      .link-btn { background:none; border:none; color:#9aa2ab; font-size:13px; cursor:pointer; padding:0; }
      .primary-btn { width:100%; background:#e88b3c; color:#161207; border:none; padding:13px 18px; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; }
      .flow-input { width:100%; margin-top:6px; }
      .integration-grid { display:grid; grid-template-columns: 1fr; gap:12px; }
      @media (min-width:480px){ .integration-grid{ grid-template-columns: 1fr 1fr; } }
      .choice-card { background:#181b20; border:1px solid #262b31; border-radius:14px; padding:18px; text-align:start; cursor:pointer; color:#eef0f2; }
      .choice-card:hover { border-color:#e88b3c; }
      .upload-box { display:flex; align-items:center; justify-content:center; height:140px; border:1.5px dashed #2a2f36; border-radius:12px; cursor:pointer; color:#9aa2ab; font-size:13px; overflow:hidden; }
      .address-box { background:#14171b; border:1px solid #262b31; border-radius:12px; padding:16px; font-size:13.5px; line-height:1.6; }
      ::selection { background:#e88b3c55; }
    `}</style>
  );
}
