import { useEffect, useRef } from 'react';
import { formatChartDate, formatChartDateFull, formatNumber } from '../lib/format.js';

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 28;
const CHART_PLOT_HEIGHT = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
const CHART_BASELINE = CHART_PAD_TOP + CHART_PLOT_HEIGHT;
const SVG_NS = 'http://www.w3.org/2000/svg';

export default function StatsChart({ points }) {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const svg = svgRef.current;
        const tooltip = tooltipRef.current;
        svg.innerHTML = '';

        if (!points.length) return;

        const maxValue = Math.max(1, ...points.map((p) => p.diamonds));
        const stepX = points.length > 1 ? CHART_WIDTH / (points.length - 1) : 0;
        const xAt = (i) => i * stepX;
        const yAt = (v) => CHART_BASELINE - (v / maxValue) * CHART_PLOT_HEIGHT;

        for (let i = 0; i <= 2; i++) {
            const y = CHART_PAD_TOP + (CHART_PLOT_HEIGHT / 2) * i;
            const gridline = document.createElementNS(SVG_NS, 'line');
            gridline.setAttribute('x1', '0');
            gridline.setAttribute('x2', String(CHART_WIDTH));
            gridline.setAttribute('y1', String(y));
            gridline.setAttribute('y2', String(y));
            gridline.setAttribute('style', 'stroke: var(--color-border); stroke-width: 1;');
            svg.appendChild(gridline);
        }

        const linePoints = points.map((p, i) => `${xAt(i)},${yAt(p.diamonds)}`).join(' L ');

        const defs = document.createElementNS(SVG_NS, 'defs');
        const gradient = document.createElementNS(SVG_NS, 'linearGradient');
        gradient.setAttribute('id', 'stats-chart-gradient');
        gradient.setAttribute('x1', '0');
        gradient.setAttribute('y1', '0');
        gradient.setAttribute('x2', '0');
        gradient.setAttribute('y2', '1');

        const stopTop = document.createElementNS(SVG_NS, 'stop');
        stopTop.setAttribute('offset', '0%');
        stopTop.setAttribute('style', 'stop-color: var(--color-primary-600); stop-opacity: 0.35;');
        const stopBottom = document.createElementNS(SVG_NS, 'stop');
        stopBottom.setAttribute('offset', '100%');
        stopBottom.setAttribute('style', 'stop-color: var(--color-primary-600); stop-opacity: 0;');
        gradient.append(stopTop, stopBottom);
        defs.appendChild(gradient);
        svg.appendChild(defs);

        const area = document.createElementNS(SVG_NS, 'path');
        area.setAttribute('d', `M0,${CHART_BASELINE} L ${linePoints} L ${CHART_WIDTH},${CHART_BASELINE} Z`);
        area.setAttribute('fill', 'url(#stats-chart-gradient)');
        area.setAttribute('stroke', 'none');
        svg.appendChild(area);

        const line = document.createElementNS(SVG_NS, 'path');
        line.setAttribute('d', `M ${linePoints}`);
        line.setAttribute('fill', 'none');
        line.setAttribute('style', 'stroke: var(--color-primary-600); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;');
        svg.appendChild(line);

        const labelEvery = Math.max(1, Math.round(points.length / 6));
        points.forEach((p, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return;

            const text = document.createElementNS(SVG_NS, 'text');
            text.setAttribute('x', String(xAt(i)));
            text.setAttribute('y', String(CHART_HEIGHT - 6));
            text.setAttribute('text-anchor', i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle');
            text.setAttribute('style', 'fill: var(--color-text-muted); font-size: 10px;');
            text.textContent = formatChartDate(p.date);
            svg.appendChild(text);
        });

        const hoverLine = document.createElementNS(SVG_NS, 'line');
        hoverLine.setAttribute('y1', String(CHART_PAD_TOP));
        hoverLine.setAttribute('y2', String(CHART_BASELINE));
        hoverLine.setAttribute('style', 'stroke: var(--color-text-muted); stroke-width: 1; opacity: 0;');
        svg.appendChild(hoverLine);

        const hoverDot = document.createElementNS(SVG_NS, 'circle');
        hoverDot.setAttribute('r', '4');
        hoverDot.setAttribute('style', 'fill: var(--color-primary-600); opacity: 0;');
        svg.appendChild(hoverDot);

        const capture = document.createElementNS(SVG_NS, 'rect');
        capture.setAttribute('x', '0');
        capture.setAttribute('y', '0');
        capture.setAttribute('width', String(CHART_WIDTH));
        capture.setAttribute('height', String(CHART_HEIGHT));
        capture.setAttribute('fill', 'transparent');
        svg.appendChild(capture);

        function handleMouseMove(event) {
            const rect = svg.getBoundingClientRect();
            const relX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
            let index = stepX ? Math.round(relX / stepX) : 0;
            index = Math.min(points.length - 1, Math.max(0, index));

            const point = points[index];
            const x = xAt(index);
            const y = yAt(point.diamonds);

            hoverLine.setAttribute('x1', String(x));
            hoverLine.setAttribute('x2', String(x));
            hoverLine.style.opacity = '1';
            hoverDot.setAttribute('cx', String(x));
            hoverDot.setAttribute('cy', String(y));
            hoverDot.style.opacity = '1';

            tooltip.hidden = false;
            tooltip.style.left = `${(x / CHART_WIDTH) * rect.width}px`;
            tooltip.style.top = `${(y / CHART_HEIGHT) * rect.height}px`;
            tooltip.innerHTML = '';

            const dateEl = document.createElement('p');
            dateEl.className = 'font-medium';
            dateEl.textContent = formatChartDateFull(point.date);
            const valueEl = document.createElement('p');
            valueEl.className = 'text-text-muted';
            valueEl.textContent = `${formatNumber(point.diamonds)} diamonds`;
            tooltip.append(dateEl, valueEl);
        }

        function handleMouseLeave() {
            hoverLine.style.opacity = '0';
            hoverDot.style.opacity = '0';
            tooltip.hidden = true;
        }

        capture.addEventListener('mousemove', handleMouseMove);
        capture.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            capture.removeEventListener('mousemove', handleMouseMove);
            capture.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [points]);

    return (
        <div className="relative">
            <svg ref={svgRef} viewBox="0 0 600 200" preserveAspectRatio="none" className="h-56 w-full"></svg>
            <div ref={tooltipRef} hidden className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-surface-alt px-2.5 py-1.5 text-xs shadow-lg"></div>
        </div>
    );
}
