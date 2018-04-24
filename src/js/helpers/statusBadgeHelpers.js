import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactTooltip from 'react-tooltip';
import { Glyphicon } from 'react-bootstrap';
import InvalidatedIcon from '../components/svgIcons/InvalidatedIcon';
import * as styles from '../components/groupMenu/Style';

/**
 * @description - Takes an array of strings that are glyph names and gets the proper React component to render them
 * @param {*} glyphs 
 */
export function getGlyphIcons(glyphs) {
  const glyphicons = [];
  if (glyphs && glyphs.length) {
    glyphs.forEach((glyph)=>{
      if (glyph === 'invalidated') {
        glyphicons.push(<div key={glyph} className={'glyphicon glyphicon-invalidated'}><InvalidatedIcon height={16} width={16} /></div>);
      } else {
        let style = (styles.menuItem.statusIcon[glyph]?styles.menuItem.statusIcon[glyph]:{});
        glyphicons.push(<Glyphicon key={glyph} glyph={glyph} style={style} />);
      }
    });
  } else {
    glyphicons.push(<div key="blank" className="glyphicon glyphicon-blank" style={styles.menuItem.statusIcon.blank} />);
  }
  return glyphicons;
}

/**
 * @description - Takes an array of glyph names, gets their React components and then renders the status badge
 * with the first icon and then a mouse-over tooltip with the rest of the icons and a chip to say how many icons there are.
 * @param {*} glyphs 
 */
export function getStatusBadge(glyphs) {
  const statusGlyphs = getGlyphIcons(glyphs);
  const mainGlyph = statusGlyphs[0];
  if (statusGlyphs.length > 1) {
    const tooltip = ReactDOMServer.renderToString(statusGlyphs);
    return (
      <div className="status-badge-wrapper">
        <div
          className="status-badge"
          data-tip={tooltip}
          data-html="true"
          data-place="bottom"
          data-effect="float"
          data-class="status-tooltip"
          data-delay-hide="100"
          data-offset="{'bottom': -5, 'right': 5}" >
          {mainGlyph}
          <div className="badge">
              {statusGlyphs.length}
          </div>
        </div>
        <ReactTooltip />
      </div>
    );
  } else {
    return (
      <div className="status-badge-wrapper">
        <div className="status-badge">
          {mainGlyph}
        </div>
      </div>
    );
  }  
}
