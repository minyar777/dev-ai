// ===== Variables et constantes globales =====
var listeProduit;
var panier = new Array();
const TAUX_TPS = 0.05;
const TAUX_TVQ = 0.09975;

// ===== 1. Chargement des produits via AJAX =====
function chargerzoneitem() {
    chargerPanier(); // récupère le panier sauvegardé

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "produits.json", true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var objJSON = JSON.parse(xhr.responseText);
                listeProduit = objJSON.liste;
                afficherListeProduits();
            } else {
                alert("Erreur lors de la récupération des données (Status " + xhr.status + ")");
            }
        }
    };
    xhr.send();
}

// ===== 2. Affichage dynamique des produits =====
function afficherListeProduits() {
    listeProduit.forEach(function (item) {
        var noeudDivItem = document.createElement("div");
        noeudDivItem.setAttribute("class", "item");

        var noeudImage = document.createElement("img");
        noeudImage.setAttribute("class", "imageItem");
        noeudImage.setAttribute("src", item.image);
        noeudImage.addEventListener("click", function () {
            afficherDetail(item);
        });
        noeudDivItem.appendChild(noeudImage);

        var noeudDescription = document.createElement("div");
        noeudDescription.setAttribute("class", "description");
        noeudDescription.appendChild(document.createTextNode(item.description));
        noeudDivItem.appendChild(noeudDescription);

        var noeudPrix = document.createElement("div");
        noeudPrix.setAttribute("class", "prix");
        noeudPrix.appendChild(document.createTextNode(item.prix));
        noeudDivItem.appendChild(noeudPrix);

        var noeudBtnAjouter = document.createElement("div");
        noeudBtnAjouter.setAttribute("class", "ajouter");
        noeudBtnAjouter.appendChild(document.createTextNode("Ajouter"));
        noeudBtnAjouter.addEventListener("click", function () {
            var ligneCommande = { produit: item, quantite: "1" };
            ajouterItem(ligneCommande);
        });
        noeudDivItem.appendChild(noeudBtnAjouter);

        document.getElementById("zoneContenuItem").appendChild(noeudDivItem);
    });
}

// ===== 3. Boîte de détail =====
function afficherDetail(unProduit) {
    document.querySelector("#zoneDetail").style.display = "block";
    document.querySelector("#uneImage").src = unProduit.image;
    document.querySelector("#uneDescription").innerHTML = unProduit.description;
    document.querySelector("#unPrix").innerHTML = unProduit.prix;
    document.querySelector("#unDetail").innerHTML = unProduit.details;

    // onclick (et non addEventListener) pour ne pas empiler les écouteurs
    document.querySelector("#unAjout").onclick = function () {
        var qte = document.querySelector("#txtQuantite").value;
        var ligneCommande = { produit: unProduit, quantite: qte };
        ajouterItem(ligneCommande);
        document.querySelector("#zoneDetail").style.display = "none";
        document.querySelector("#txtQuantite").value = "1";
    };
}

function fermerDialogue() {
    document.querySelector("#zoneDetail").style.display = "none";
}

// ===== 4. Gestion du panier =====
function ajouterItem(ligneCommande) {
    // Si le produit est déjà dans le panier, on additionne la quantité
    var existante = panier.find(function (l) {
        return l.produit.description === ligneCommande.produit.description;
    });
    if (existante) {
        existante.quantite = parseInt(existante.quantite) + parseInt(ligneCommande.quantite);
    } else {
        panier.push(ligneCommande);
    }
    enregistrerPanier();
    majCompteurPanier();
}

function majCompteurPanier() {
    var totalQte = 0;
    panier.forEach(function (l) {
        totalQte += parseInt(l.quantite);
    });
    document.getElementById("idItem").innerHTML = totalQte;
}

// ===== 5. Sauvegarde / récupération du panier =====
function enregistrerPanier() {
    if (typeof (localStorage) == "undefined") {
        alert("Votre navigateur ne supporte pas le stockage local");
        return;
    }
    localStorage.setItem("panier", JSON.stringify(panier));
}

function chargerPanier() {
    if (typeof (localStorage) == "undefined") {
        alert("Votre navigateur ne supporte pas le stockage local");
        return;
    }
    if (!localStorage.getItem("panier")) {
        return;
    }
    panier = JSON.parse(localStorage.getItem("panier"));
    majCompteurPanier();
}

// ===== 6. Facture =====
function affficheFactureVide() {} // (inutile, à ignorer)

function afficheFacture() {
    document.getElementById("zoneContenuItem").style.display = "none";
    document.getElementById("zoneContenuFacture").style.display = "block";
    document.getElementById("zoneContenuFacture").style.height = "85%";

    var noeudTBody = document.querySelector("#corpsTableau");
    noeudTBody.innerHTML = ""; // vide le tableau avant de le reconstruire

    panier.forEach(function (ligneCommande, index) {
        var noeudTr = document.createElement("tr");

        var noeudTd1 = document.createElement("td");
        noeudTd1.appendChild(document.createTextNode(ligneCommande.produit.description));
        noeudTr.appendChild(noeudTd1);

        var noeudTd2 = document.createElement("td");
        var noeudInput = document.createElement("input");
        noeudInput.setAttribute("type", "text");
        noeudInput.setAttribute("value", ligneCommande.quantite);
        noeudInput.addEventListener("change", function () {
            panier[index].quantite = this.value;
            enregistrerPanier();
            calculerFacture();
        });
        noeudTd2.appendChild(noeudInput);
        noeudTr.appendChild(noeudTd2);

        var noeudTd3 = document.createElement("td");
        noeudTd3.appendChild(document.createTextNode(ligneCommande.produit.prix));
        noeudTr.appendChild(noeudTd3);

        noeudTBody.appendChild(noeudTr);
    });

    calculerFacture();
}

function calculerFacture() {
    var sousTotal = 0;
    var totalQte = 0;

    panier.forEach(function (ligneCommande) {
        var quantite = parseInt(ligneCommande.quantite) || 0;
        var prix = parseFloat(ligneCommande.produit.prix);
        sousTotal += quantite * prix;
        totalQte += quantite;
    });

    var totalTPS = sousTotal * TAUX_TPS;
    var totalTVQ = sousTotal * TAUX_TVQ;
    var total = sousTotal + totalTPS + totalTVQ;

    document.querySelector("#idSousTotal").innerHTML = sousTotal.toFixed(2) + " $";
    document.querySelector("#idTPS").innerHTML = totalTPS.toFixed(2) + " $";
    document.querySelector("#idTVQ").innerHTML = totalTVQ.toFixed(2) + " $";
    document.querySelector("#idTotal").innerHTML = total.toFixed(2) + " $";

    document.getElementById("idItem").innerHTML = totalQte;
}