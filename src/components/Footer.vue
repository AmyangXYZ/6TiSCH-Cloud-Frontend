<template>
<div class="footer">
	<vs-card id="card">
		<vs-row vs-align="center" vs-type="flex" >
			<vs-col class="c" vs-offset="9" vs-w="4" vs-align="center" > 
				<h3><a href="https://cps.cse.uconn.edu/">&#9400; Cyber-Physical Systems Laboratory, UConn</a></h3>
			</vs-col>
		</vs-row>
	</vs-card>
</div>
</template>

<script>
export default {
	
}
</script>

<style lang="stylus" scoped>
.footer
  overflow: hidden;
  position absolute
  bottom 0
  height 50px
  width 100%
#card
  height 50px
  width 100%
  margin 0
  padding 5px
  border-radius 0px
  color black
  h3
    font-size 0.7rem
	a
    color #36454A
  a:hover
    text-decoration underline
</style>