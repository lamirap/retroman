'use strict';

angular.module('retroman')
  .directive("retroCard", function() {
    return {
        restrict: 'E',
        templateUrl: 'html/retro-card.html',
        controller: function($scope) {
          //console.debug($scope.retro);
          
          $scope.retro.retroQR = new QRCode(document.getElementById("retro-qrcode"), {
            text: window.location.origin + "/#!/home/" + $scope.retro.retroId,
            width: 80,
            height: 80,
            colorDark : "#666666",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
          });

        }
    };
});