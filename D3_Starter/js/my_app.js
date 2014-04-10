$(document).ready(function() {
    // executes when page is fully loaded.
    
    d3.json('cantons.json', function(err, data) {
        console.log(data);
        
        var cantons = d3.select('svg g').selectAll('g').data(data);
        
        var g = cantons.enter().append('g');
        
        g.append('text').text(function(d){return d.name});
        
        var number_of_cantons = data.length;
        
        g.attr('transform', function(d, i) {
            var x = Math.cos(Math.PI * 2 * i / number_of_cantons) * 150;
            var y = Math.sin(Math.PI * 2 * i / number_of_cantons) * 150;
            return 'translate(' + x + ','+ y + ')';
        });
        
        g.append('circle').attr('r', 20).style('opacity', 0.5);
        
        var data_index = 0;
        
        d3.select('body').on('click', function() {
            console.log('clicked  hallo');
            
            data_index = ++data_index % data[0].numbers.length;
            console.log(data_index);
            
            d3.select('svg g text').text(data[0].numbers[data_index].name);
        });
        
        var scale = d3.scale.linear();
        scale.range([100, 100]);
        scale.domain([0, d3.max( data, function(d) { return d.numbers[data_index].value; })]);
        
        g.select('circle')
            .attr('r', function(d) {
            scale(d.numbers[data_index].value);
        });
    })
});