<template>
	<vs-card class="footer" >
		<vs-row vs-align="center" vs-type="flex" >
			<vs-col class="c" vs-offset="9" vs-w="4" vs-align="center" > 
				<h3><a href="https://cps.cse.uconn.edu/">&#9400; Cyber-Physical Systems Laboratory, UConn</a></h3>
			</vs-col>
		</vs-row>
	</vs-card>
</template>

<script>
export default {
	
}
</script>

<style lang="stylus" scoped>
.vs-card--content
	margin-bottom 0px
.footer
	width 100%
	height 6.6vh
	border-radius 0px
	padding 1.8vh
	margin-top 3vh
	margin-bottom -5vh
	color black
	h3
		font-size 0.8rem
	a
		color #36454A
	a:hover
		text-decoration underline
</style>