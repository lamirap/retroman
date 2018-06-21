'use strict';

angular.module('retroman')
  .directive("retroCard", function() {
    return {
        restrict: 'E',
        templateUrl: 'html/retro-card.html',
        controller: function($scope) {
          console.debug($scope.retro);
          
          $scope.retro.retroQR = new QRCode(document.getElementById("retro-qrcode"), {
            text: window.location.origin + "/#!/home/" + $scope.retro.retroId,
            width: 128,
            height: 128,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
          });

        }
    };
});