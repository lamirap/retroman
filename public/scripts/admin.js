angular.module('retroman')
 .controller('AdminController', function ($scope) {
    $scope.message = 'This is the admin page.';
    $scope.items = []
    
    $scope.init = function() {
        console.log("Initialized AdminController");
        
        var item1 = {};
        var item2 = {};
        item1.name = "Hello";
        item2.name = "Hello2";
        
        $scope.items.push(item1);
        $scope.items.push(item2);
    }
    
    $scope.init();
 });